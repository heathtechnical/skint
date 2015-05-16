(function() {
  var Code, Lab, lab, server;

  Lab = require("lab");

  Code = require("code");

  lab = exports.lab = Lab.script();

  server = require('../server');

  lab.experiment("Basic functionality tests", function() {
    return lab.test("Document root", function(done) {
      var options;
      options = {
        method: "GET",
        url: "/"
      };
      return server.inject(options, function(response) {
        Code.expect(response.statusCode.to.equal(200));
        return done;
      });
    });
  });

}).call(this);
