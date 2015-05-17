Lab = require "lab"
Code = require "code"
lab = exports.lab = Lab.script()
server = require('../server')

lab.experiment "Basic functionality tests", () ->
  lab.test "Document root", (done) ->
    options = method: "GET", url: "/"
    server.inject options, (response) ->
      Code.expect(response.statusCode).to.equal 200
      done()

  lab.test "Non-existent account", (done) ->
    options = method: "GET", url: "/account/noexist"
    server.inject options, (response) ->
      Code.expect(response.statusCode).to.equal 400
      Code.expect(response.result.message).to.equal "Not found"
      done()

  lab.test "New account, no name supplied", (done) ->
    options = method: "POST", url: "/account"
    server.inject options, (response) ->
      Code.expect(response.statusCode).to.equal 400
      done()
