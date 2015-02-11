Hapi = require 'hapi'
path = require 'path'
mongo = require 'mongoskin'
paymentCycle = require './classes/paymentCycle'

db = mongo.db "mongodb://localhost/skint-mt", native_parser: true
db.bind "collection"

s = new Hapi.Server()

s.views({
    engines: { html: require 'handlebars' },
    path: path.join __dirname, './views'
})

s.connection port: 3000

s.route
    method: 'GET',
    path: '/',
    handler: (request, reply) ->
        reply.view 'index'

s.route
    method: 'GET',
    path: '/account/{id}',
    handler: (request, reply) ->
        db.collection.findById request.params.id, (err, item) ->
            # Setup new payment cycle
            pc = new paymentCycle(item.payment_cycle_day)
            for payment in item.scheduled_payments then do (payment) ->
                pi = pc.addPayment(payment.day, payment.description, payment.amount)

                payment.fuzzy = pi.fuzzy
                payment.isRemaining = pi.isRemaining

            # Calculate subtotals and add to estimated balance
            st = pc.getRemainingPaymentSubtotals()
            item.quickstats.remaining_scheduled_payments = st
            item.quickstats.estimated_closing_balance = item.current_balance + st[0] + st[1]

            # Calculate ad-hoc payments 
            item.quickstats.remaining_adhoc_payments = [ 0, 0 ]
            for payment in item.adhoc_payments then do (payment) ->
                item.quickstats.remaining_adhoc_payments[0] += payment.amount if payment.amount > 0
                item.quickstats.remaining_adhoc_payments[1] += payment.amount if payment.amount < 0
                item.quickstats.estimated_closing_balance += payment.amount

            # Send to client
            reply item

s.route
    method: 'POST',
    path: '/account/{id}/update',
    handler: (request, reply) ->
        if request.payload.current_balance
            db.collection.updateById request.params.id, { $set: { 'current_balance': parseFloat(request.payload.current_balance) } }, {}, () -> 
                reply { done: "success" }
        else if request.payload.payment_cycle_day
            db.collection.updateById request.params.id, { $set: { 'payment_cycle_day': parseInt(request.payload.payment_cycle_day) } }, {}, () -> 
                reply { done: "success" }
        else if request.payload.add_payment
            payment_type = request.payload.add_payment.type + "_payments"
            update = {}
            update[payment_type] = {
                'description': request.payload.add_payment.description,
                'day': parseInt(request.payload.add_payment.day), 
                'amount': parseFloat(request.payload.add_payment.amount)
            }
            
            db.collection.findOne { 
                '_id': mongo.helper.toObjectID(request.params.id), 
                "scheduled_payments.description": update[payment_type].description
            }, {}, (err, item) ->
                if item
                    return reply { done: "duplicate" }
                else
                    db.collection.updateById request.params.id, { $push: update }, {}, (err) -> 
                        return reply { done: "success" }
        else if request.payload.delete_payment
            request.payload.delete_payment.day = parseInt request.payload.delete_payment.day
            db.collection.updateById request.params.id, { $pull: { 'scheduled_payments': request.payload.delete_payment } }, {}, (err) ->
                console.log err
                return reply { done: "success" }

s.route
    method: 'GET',
    path: '/assets/{param*}',
    handler: directory: path: "assets"

s.start()

