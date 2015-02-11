(function() {
  var Hapi, db, mongo, path, paymentCycle, s;

  Hapi = require('hapi');

  path = require('path');

  mongo = require('mongoskin');

  paymentCycle = require('./lib/paymentCycle');

  db = mongo.db("mongodb://localhost/skint-mt", {
    native_parser: true
  });

  db.bind("collection");

  s = new Hapi.Server();

  s.views({
    engines: {
      html: require('handlebars')
    },
    path: path.join(__dirname, './src/views')
  });

  s.connection({
    port: 3000
  });

  s.route({
    method: 'GET',
    path: '/',
    handler: function(request, reply) {
      return reply.view('index');
    }
  });

  s.route({
    method: 'GET',
    path: '/main',
    handler: function(request, reply) {
      return reply.view('main');
    }
  });

  s.route({
    method: 'POST',
    path: '/account',
    handler: function(request, reply) {
      return db.collection.insert({
        name: request.payload.account_name,
        payment_cycle_day: 1,
        payments: [],
        current_balance: 0,
        historic_balance: []
      }, function(err, docs) {
        return reply({
          "success": "yes",
          "account_id": docs[0]['_id']
        });
      });
    }
  });

  s.route({
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

  s.route({
    method: 'GET',
    path: '/account/{id}',
    handler: function(request, reply) {
      return db.collection.findById(request.params.id, function(err, item) {
        var payment, pc, st, _fn, _fn1, _i, _j, _len, _len1, _ref, _ref1;
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

  s.route({
    method: 'POST',
    path: '/account/{id}/update',
    handler: function(request, reply) {
      var payment, update;
      if (request.payload.current_balance) {
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
        }, {}, function() {
          return reply({
            done: "success"
          });
        });
      } else if (request.payload.payment_cycle_day) {
        return db.collection.updateById(request.params.id, {
          $set: {
            'payment_cycle_day': parseInt(request.payload.payment_cycle_day)
          }
        }, {}, function() {
          return reply({
            done: "success"
          });
        });
      } else if (request.payload.add_payment) {
        update = {
          'id': mongo.ObjectID(),
          'type': request.payload.add_payment.type,
          'description': request.payload.add_payment.description,
          'amount': parseFloat(request.payload.add_payment.amount),
          'last_modified': new Date()
        };
        if (request.payload.add_payment.type === "scheduled") {
          update.day = parseInt(request.payload.add_payment.day);
        }
        return db.collection.updateById(request.params.id, {
          $push: {
            'payments': update
          }
        }, {}, function(err) {
          return reply({
            done: "success"
          });
        });
      } else if (request.payload.delete_payment) {
        payment = {
          id: mongo.helper.toObjectID(request.payload.delete_payment.id)
        };
        console.log(payment);
        return db.collection.updateById(request.params.id, {
          $pull: {
            'payments': payment
          }
        }, {}, function(err) {
          return reply({
            done: "success"
          });
        });
      } else if (request.payload.update_payment) {
        update = {
          'payments.$.description': request.payload.update_payment.description,
          'payments.$.amount': parseFloat(request.payload.update_payment.amount)
        };
        if (request.payload.update_payment.type === "scheduled") {
          update['payments.$.day'] = parseInt(request.payload.update_payment.day);
        }
        return db.collection.update({
          '_id': mongo.helper.toObjectID(request.params.id),
          "payments.id": mongo.helper.toObjectID(request.payload.update_payment.id)
        }, {
          $set: update
        }, function(err) {
          return reply({
            done: "success"
          });
        });
      }
    }
  });

  s.route({
    method: 'GET',
    path: '/account/{id}/chart',
    handler: function(request, reply) {
      console.log("Fetching ID: " + request.params.id);
      return db.collection.findById(request.params.id, function(err, item) {
        console.log(item);
        return reply({
          done: "success"
        });
      });
    }
  });

  s.route({
    method: 'GET',
    path: '/assets/{param*}',
    handler: {
      directory: {
        path: "assets"
      }
    }
  });

  s.start();

}).call(this);
