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
        Code.expect(response.result.message).to.equal("foo");
        return done();
      });
    });
    return lab.test("New account, no name supplied", function(done) {
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
  });

}).call(this);
