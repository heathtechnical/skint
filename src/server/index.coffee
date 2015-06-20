paymentCycle = require '../server/lib/paymentCycle'
mongo = require 'mongoskin'
Boom = require 'boom'
util = require 'util'

db = mongo.db "mongodb://localhost/skint-mt", native_parser: true
db.bind "collection"

exports.register = (server, options, next) ->
  # GET /
  # Render main template
  server.route
    method: 'GET',
    path: '/',
    handler: (request, reply) ->
      reply.view 'main'

  # POST /account { account_name }
  # Create a new account
  server.route
    method: 'POST',
    path: '/account',
    handler: (request, reply) ->
      return reply Boom.badRequest "No account name" if not
        request.payload.account_name or not
        request.payload.payment_cycle_day

      db.collection.insert {
      name: request.payload.account_name,
      payment_cycle_day: request.payload.payment_cycle_day,
      payments: [],
      current_balance: 0,
      historic_balance: [] },
      (err, docs) ->
        if err
          return reply Boom.badRequest "Database error"

        return reply { "success": "yes", "account_id": docs[0]['_id'] }

  server.route
    method: 'GET',
    path: '/account',
    handler: (request, reply) ->
      db.collection.find({}, {_id:1, name:1, current_balance:1 })
      .toArray (err, items) ->
        reply items

  # GET /account/{id}
  # Return account data for given account id
  server.route
    method: 'GET',
    path: '/account/{id}',
    handler: (request, reply) ->
      db.collection.findById request.params.id, (err, item) ->
        return reply Boom.badRequest "Database error" if err
        return reply Boom.badRequest "Not found" if not item

        # Setup new payment cycle
        pc = new paymentCycle(item.payment_cycle_day)
        for payment in item.payments then do (payment) ->
          if payment.type == "scheduled"
            pi = pc.addPayment(payment.day, payment.description, payment.amount)
            payment.fuzzy = pi.fuzzy
            payment.isRemaining = pi.isRemaining

        # Calculate subtotals and add to estimated balance
        st = pc.getRemainingPaymentSubtotals()
        item.quickstats = {}
        item.quickstats.remaining_scheduled_payments = st
        item.quickstats.estimated_closing_balance = item.current_balance +
        st[0] + st[1]

        # Calculate ad-hoc payments
        item.quickstats.remaining_adhoc_payments = [ 0, 0 ]
        for payment in item.payments then do (payment) ->
          if payment.type == "adhoc"
            item.quickstats.remaining_adhoc_payments[0] +=
            payment.amount if payment.amount > 0
            item.quickstats.remaining_adhoc_payments[1] +=
            payment.amount if payment.amount < 0
            item.quickstats.estimated_closing_balance += payment.amount

        # Send to client
        return reply item

  server.route
    method: 'POST'
    path: '/account/{id}/update/account_name'
    handler: (request, reply) ->
      return reply Boom.badRequest "No account name provided" if not
        request.payload.account_name

      db.collection.updateById request.params.id, {
        $set: {
        'name': request.payload.account_name
        }}, {}, (err, mods) ->
          return reply Boom.badRequest "Database error" if err or
            mods != 1

          return reply { done: "success" }

  server.route
    method: 'POST'
    path: '/account/{id}/update/balance'
    handler: (request, reply) ->
      return reply Boom.badRequest "No balance provided" if not
        request.payload.current_balance

      db.collection.updateById request.params.id, {
        $set: {
        'current_balance': parseFloat(request.payload.current_balance)
        },
        $push: {
        'historic_balance': {
          'date': new Date(),
          'balance': parseFloat(request.payload.current_balance)
        }}}, {}, (err, mods) ->
          return reply Boom.badRequest "Database error" if err or
            mods != 1

          return reply { done: "success" }

  server.route
    method: 'POST'
    path: '/account/{id}/update/payment_cycle_day'
    handler: (request, reply) ->
      return reply Boom.badRequest "No payment cycle day provided" if not
        request.payload.payment_cycle_day

      db.collection.updateById request.params.id, {
        $set: {
          'payment_cycle_day': parseInt(request.payload.payment_cycle_day)
        }}, {}, (err, mods) ->
          return reply Boom.badRequest "Database error" if err or
            mods != 1

          return reply { done: "success" }

  server.route
    method: 'POST'
    path: '/account/{id}/update/add_payment'
    handler: (request, reply) ->
      return reply Boom.badRequest "No payment information provided" if not
        request.payload.type or not
        request.payload.description or not
        request.payload.amount

      update = {
        'id': mongo.ObjectID()
        'type': request.payload.type,
        'description': request.payload.description,
        'amount': parseFloat(request.payload.amount),
        'last_modified': new Date()
      }

      if request.payload.type == "scheduled"
        update.day = parseInt(request.payload.day)
      
      db.collection.updateById request.params.id, {
        $push: 'payments': update }, {}, (err, mods) ->
          return reply Boom.badRequest "Database error" if err or
            mods != 1

          return reply { done: "success" }

  server.route
    method: 'POST'
    path: '/account/{id}/update/delete_payment'
    handler: (request, reply) ->
      return reply Boom.badRequest "No payment id provided" if not
        request.payload.id

      payment = {
        id: mongo.helper.toObjectID(request.payload.id)
      }

      db.collection.updateById request.params.id, {
        $pull: 'payments': payment }, {}, (err, mods) ->
          return reply Boom.badRequest "Database error" if err or
            mods != 1

          return reply { done: "success" }

  server.route
    method: 'POST'
    path: '/account/{id}/update/update_payment'
    handler: (request, reply) ->
      return reply Boom.badRequest "No payment information provided" if not
        request.payload.description or not
        request.payload.amount or not
        request.payload.id

      update = {
        'payments.$.description': request.payload.description,
        'payments.$.amount': parseFloat(request.payload.amount)
      }

      if request.payload.day
        update['payments.$.day'] = parseInt(request.payload.day)

      db.collection.update {
        '_id': mongo.helper.toObjectID(request.params.id),
        "payments.id": mongo.helper.toObjectID(request.payload.id)
      }, {
        $set: update
      }, (err, mods) ->
          return reply Boom.badRequest "Database error" if err or
            mods != 1

          return reply { done: "success" }

  # GET /account/{id}/chart
  # Return data required for graph
  server.route
    method: 'GET',
    path: '/account/{id}/chart',
    handler: (request, reply) ->
      db.collection.findById request.params.id, (err, item) ->
        return reply { done: "success" }

  next()

exports.register.attributes = {
  name: 'base'
}
