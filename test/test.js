(function() {
  var Code, Lab, lab, server;

  Lab = require("lab");

  Code = require("code");

  lab = exports.lab = Lab.script();

  server = require('../server');

  lab.experiment("Basic functionality tests", function() {
    lab.test("Document root", function(done) {
      var options;
      options = {
        method: "GET",
        url: "/"
      };
      return server.inject(options, function(response) {
        Code.expect(response.statusCode).to.equal(200);
        return done();
      });
    });
    lab.test("Non-existent account", function(done) {
      var options;
      options = {
        method: "GET",
        url: "/account/noexist"
      };
      return server.inject(options, function(response) {
        Code.expect(response.statusCode).to.equal(400);
        Code.expect(response.result.message).to.equal("Not found");
        return done();
      });
    });
    lab.test("New account, no name supplied", function(done) {
      var options;
      options = {
        method: "POST",
        url: "/account"
      };
      return server.inject(options, function(response) {
        Code.expect(response.statusCode).to.equal(400);
        return done();
      });
    });
    lab.test("No account balance provided", function(done) {
      var options;
      options = {
        method: "POST",
        url: "/account/noexist/update/balance"
      };
      return server.inject(options, function(response) {
        Code.expect(response.statusCode).to.equal(400);
        Code.expect(response.result.message).to.equal("No balance provided");
        return done();
      });
    });
    lab.test("Non-existent account when updating balance", function(done) {
      var options;
      options = {
        method: "POST",
        url: "/account/noexist/update/balance",
        payload: JSON.stringify({
          current_balance: 100
        })
      };
      return server.inject(options, function(response) {
        Code.expect(response.statusCode).to.equal(400);
        Code.expect(response.result.message).to.equal("Database error");
        return done();
      });
    });
    lab.test("No payment cycle day provided", function(done) {
      var options;
      options = {
        method: "POST",
        url: "/account/noexist/update/payment_cycle_day"
      };
      return server.inject(options, function(response) {
        Code.expect(response.statusCode).to.equal(400);
        Code.expect(response.result.message).to.equal("No payment cycle day provided");
        return done();
      });
    });
    lab.test("Non-existent account when updating payment cycle", function(done) {
      var options;
      options = {
        method: "POST",
        url: "/account/noexist/update/payment_cycle_day",
        payload: JSON.stringify({
          payment_cycle_day: 10
        })
      };
      return server.inject(options, function(response) {
        Code.expect(response.statusCode).to.equal(400);
        Code.expect(response.result.message).to.equal("Database error");
        return done();
      });
    });
    lab.test("No payment info when adding payment", function(done) {
      var options;
      options = {
        method: "POST",
        url: "/account/noexist/update/add_payment"
      };
      return server.inject(options, function(response) {
        Code.expect(response.statusCode).to.equal(400);
        Code.expect(response.result.message).to.equal("No payment information provided");
        return done();
      });
    });
    lab.test("Non-existent account when adding payment", function(done) {
      var options;
      options = {
        method: "POST",
        url: "/account/noexist/update/add_payment",
        payload: JSON.stringify({
          type: 'scheduled',
          description: 'test',
          amount: 10
        })
      };
      return server.inject(options, function(response) {
        Code.expect(response.statusCode).to.equal(400);
        Code.expect(response.result.message).to.equal("Database error");
        return done();
      });
    });
    lab.test("No payment info when deleting payment", function(done) {
      var options;
      options = {
        method: "POST",
        url: "/account/noexist/update/delete_payment"
      };
      return server.inject(options, function(response) {
        Code.expect(response.statusCode).to.equal(400);
        Code.expect(response.result.message).to.equal("No payment id provided");
        return done();
      });
    });
    lab.test("Non-existent account when deleting payment", function(done) {
      var options;
      options = {
        method: "POST",
        url: "/account/noexist/update/delete_payment",
        payload: JSON.stringify({
          id: 100
        })
      };
      return server.inject(options, function(response) {
        Code.expect(response.statusCode).to.equal(400);
        Code.expect(response.result.message).to.equal("Database error");
        return done();
      });
    });
    lab.test("No payment info when updating payment", function(done) {
      var options;
      options = {
        method: "POST",
        url: "/account/noexist/update/update_payment"
      };
      return server.inject(options, function(response) {
        Code.expect(response.statusCode).to.equal(400);
        Code.expect(response.result.message).to.equal("No payment information provided");
        return done();
      });
    });
    return lab.test("Non-existent account when updating payment", function(done) {
      var options;
      options = {
        method: "POST",
        url: "/account/noexist/update/update_payment",
        payload: JSON.stringify({
          id: 100,
          description: "test",
          day: 20,
          amount: 45
        })
      };
      return server.inject(options, function(response) {
        Code.expect(response.statusCode).to.equal(400);
        Code.expect(response.result.message).to.equal("Database error");
        return done();
      });
    });
  });

}).call(this);
