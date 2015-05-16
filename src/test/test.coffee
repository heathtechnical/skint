Lab = require "lab"
Code = require "code"
lab = exports.lab = Lab.script()
server = require('../server')

lab.experiment "Basic functionality tests", () ->
  lab.test "Document root", (done) ->
    options = method: "GET", url: "/"
    server.inject options, (response) ->
      Code.expect response.statusCode.to.equal 200
      done
