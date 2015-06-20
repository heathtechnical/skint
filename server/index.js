(function() {
  var Boom, db, mongo, paymentCycle, util;

  paymentCycle = require('../server/lib/paymentCycle');

  mongo = require('mongoskin');

  Boom = require('boom');

  util = require('util');

  db = mongo.db("mongodb://localhost/skint-mt", {
    native_parser: true
  });

  db.bind("collection");

  exports.register = function(server, options, next) {
    server.route({
      method: 'GET',
      path: '/',
      handler: function(request, reply) {
        return reply.view('main');
      }
    });
    server.route({
      method: 'POST',
      path: '/account',
      handler: function(request, reply) {
        if (!request.payload.account_name || !request.payload.payment_cycle_day) {
          return reply(Boom.badRequest("No account name"));
        }
        return db.collection.insert({
          name: request.payload.account_name,
          payment_cycle_day: request.payload.payment_cycle_day,
          payments: [],
          current_balance: 0,
          historic_balance: []
        }, function(err, docs) {
          if (err) {
            return reply(Boom.badRequest("Database error"));
          }
          return reply({
            "success": "yes",
            "account_id": docs[0]['_id']
          });
        });
      }
    });
    server.route({
      method: 'GET',
      path: '/account',
      handler: function(request, reply) {
        return db.collection.find({}, {
          _id: 1,
          name: 1,
          current_balance: 1
        }).toArray(function(err, items) {
          return reply(items);
        });
      }
    });
    server.route({
      method: 'GET',
      path: '/account/{id}',
      handler: function(request, reply) {
        return db.collection.findById(request.params.id, function(err, item) {
          var payment, pc, st, _fn, _fn1, _i, _j, _len, _len1, _ref, _ref1;
          if (err) {
            return reply(Boom.badRequest("Database error"));
          }
          if (!item) {
            return reply(Boom.badRequest("Not found"));
          }
          pc = new paymentCycle(item.payment_cycle_day);
          _ref = item.payments;
          _fn = function(payment) {
            var pi;
            if (payment.type === "scheduled") {
              pi = pc.addPayment(payment.day, payment.description, payment.amount);
              payment.fuzzy = pi.fuzzy;
              return payment.isRemaining = pi.isRemaining;
            }
          };
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            payment = _ref[_i];
            _fn(payment);
          }
          st = pc.getRemainingPaymentSubtotals();
          item.quickstats = {};
          item.quickstats.remaining_scheduled_payments = st;
          item.quickstats.estimated_closing_balance = item.current_balance + st[0] + st[1];
          item.quickstats.remaining_adhoc_payments = [0, 0];
          _ref1 = item.payments;
          _fn1 = function(payment) {
            if (payment.type === "adhoc") {
              if (payment.amount > 0) {
                item.quickstats.remaining_adhoc_payments[0] += payment.amount;
              }
              if (payment.amount < 0) {
                item.quickstats.remaining_adhoc_payments[1] += payment.amount;
              }
              return item.quickstats.estimated_closing_balance += payment.amount;
            }
          };
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            payment = _ref1[_j];
            _fn1(payment);
          }
          return reply(item);
        });
      }
    });
    server.route({
      method: 'POST',
      path: '/account/{id}/update/account_name',
      handler: function(request, reply) {
        if (!request.payload.account_name) {
          return reply(Boom.badRequest("No account name provided"));
        }
        return db.collection.updateById(request.params.id, {
          $set: {
            'name': request.payload.account_name
          }
        }, {}, function(err, mods) {
          if (err || mods !== 1) {
            return reply(Boom.badRequest("Database error"));
          }
          return reply({
            done: "success"
          });
        });
      }
    });
    server.route({
      method: 'POST',
      path: '/account/{id}/update/balance',
      handler: function(request, reply) {
        if (!request.payload.current_balance) {
          return reply(Boom.badRequest("No balance provided"));
        }
        return db.collection.updateById(request.params.id, {
          $set: {
            'current_balance': parseFloat(request.payload.current_balance)
          },
          $push: {
            'historic_balance': {
              'date': new Date(),
              'balance': parseFloat(request.payload.current_balance)
            }
          }
        }, {}, function(err, mods) {
          if (err || mods !== 1) {
            return reply(Boom.badRequest("Database error"));
          }
          return reply({
            done: "success"
          });
        });
      }
    });
    server.route({
      method: 'POST',
      path: '/account/{id}/update/payment_cycle_day',
      handler: function(request, reply) {
        if (!request.payload.payment_cycle_day) {
          return reply(Boom.badRequest("No payment cycle day provided"));
        }
        return db.collection.updateById(request.params.id, {
          $set: {
            'payment_cycle_day': parseInt(request.payload.payment_cycle_day)
          }
        }, {}, function(err, mods) {
          if (err || mods !== 1) {
            return reply(Boom.badRequest("Database error"));
          }
          return reply({
            done: "success"
          });
        });
      }
    });
    server.route({
      method: 'POST',
      path: '/account/{id}/update/add_payment',
      handler: function(request, reply) {
        var update;
        if (!request.payload.type || !request.payload.description || !request.payload.amount) {
          return reply(Boom.badRequest("No payment information provided"));
        }
        update = {
          'id': mongo.ObjectID(),
          'type': request.payload.type,
          'description': request.payload.description,
          'amount': parseFloat(request.payload.amount),
          'last_modified': new Date()
        };
        if (request.payload.type === "scheduled") {
          update.day = parseInt(request.payload.day);
        }
        return db.collection.updateById(request.params.id, {
          $push: {
            'payments': update
          }
        }, {}, function(err, mods) {
          if (err || mods !== 1) {
            return reply(Boom.badRequest("Database error"));
          }
          return reply({
            done: "success"
          });
        });
      }
    });
    server.route({
      method: 'POST',
      path: '/account/{id}/update/delete_payment',
      handler: function(request, reply) {
        var payment;
        if (!request.payload.id) {
          return reply(Boom.badRequest("No payment id provided"));
        }
        payment = {
          id: mongo.helper.toObjectID(request.payload.id)
        };
        return db.collection.updateById(request.params.id, {
          $pull: {
            'payments': payment
          }
        }, {}, function(err, mods) {
          if (err || mods !== 1) {
            return reply(Boom.badRequest("Database error"));
          }
          return reply({
            done: "success"
          });
        });
      }
    });
    server.route({
      method: 'POST',
      path: '/account/{id}/update/update_payment',
      handler: function(request, reply) {
        var update;
        if (!request.payload.description || !request.payload.amount || !request.payload.id) {
          return reply(Boom.badRequest("No payment information provided"));
        }
        update = {
          'payments.$.description': request.payload.description,
          'payments.$.amount': parseFloat(request.payload.amount)
        };
        if (request.payload.day) {
          update['payments.$.day'] = parseInt(request.payload.day);
        }
        return db.collection.update({
          '_id': mongo.helper.toObjectID(request.params.id),
          "payments.id": mongo.helper.toObjectID(request.payload.id)
        }, {
          $set: update
        }, function(err, mods) {
          if (err || mods !== 1) {
            return reply(Boom.badRequest("Database error"));
          }
          return reply({
            done: "success"
          });
        });
      }
    });
    server.route({
      method: 'GET',
      path: '/account/{id}/chart',
      handler: function(request, reply) {
        return db.collection.findById(request.params.id, function(err, item) {
          return reply({
            done: "success"
          });
        });
      }
    });
    return next();
  };

  exports.register.attributes = {
    name: 'base'
  };

}).call(this);
