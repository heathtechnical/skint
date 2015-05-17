paymentCycle = require '../server/lib/paymentCycle'
mongo = require 'mongoskin'
Boom = require 'boom'

db = mongo.db "mongodb://localhost/skint-mt-dev", native_parser: true
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
      if not request.payload.account_name
        return reply Boom.badRequest "No account name"

      db.collection.insert {
      name: request.payload.account_name,
      payment_cycle_day: 1,
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

  # POST /account/{id}/update
  # Update an account balance, payment cycle date, and payments
  server.route
    method: 'POST',
    path: '/account/{id}/update',
    handler: (request, reply) ->
      if request.payload.current_balance
        db.collection.updateById request.params.id, {
          $set: {
          'current_balance': parseFloat(request.payload.current_balance)
          },
          $push: {
          'historic_balance': {
            'date': new Date(),
            'balance': parseFloat(request.payload.current_balance)
          }}}, {}, () -> reply { done: "success" }
      else if request.payload.payment_cycle_day
        db.collection.updateById request.params.id, {
          $set: {
            'payment_cycle_day': parseInt(request.payload.payment_cycle_day)
          }}, {}, () -> reply { done: "success" }
      else if request.payload.add_payment
        update = {
          'id': mongo.ObjectID()
          'type': request.payload.add_payment.type,
          'description': request.payload.add_payment.description,
          'amount': parseFloat(request.payload.add_payment.amount),
          'last_modified': new Date()
        }

        if request.payload.add_payment.type == "scheduled"
          update.day = parseInt(request.payload.add_payment.day)
      
        db.collection.updateById request.params.id, {
          $push: 'payments': update }, {}, (err) -> reply { done: "success" }

      else if request.payload.delete_payment
        payment = {
          id: mongo.helper.toObjectID(request.payload.delete_payment.id)
        }

        db.collection.updateById request.params.id, {
          $pull: 'payments': payment }, {}, (err) -> reply { done: "success" }

      else if request.payload.update_payment
        update = {
          'payments.$.description': request.
            payload.update_payment.description,
          'payments.$.amount': parseFloat(request.
            payload.update_payment.amount)
        }

        if request.payload.update_payment.type == "scheduled"
          update['payments.$.day'] = parseInt(request.
            payload.update_payment.day)

        db.collection.update({
          '_id': mongo.helper.toObjectID(request.params.id),
          "payments.id": mongo.helper.toObjectID(request.
            payload.update_payment.id)
        }, {
          $set: update
        }, (err) -> reply { done: "success" } )

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
