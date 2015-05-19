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

  lab.test "No account balance provided", (done) ->
    options = method: "POST", url: "/account/noexist/update/balance"
    server.inject options, (response) ->
      Code.expect(response.statusCode).to.equal 400
      Code.expect(response.result.message).to.equal "No balance provided"
      done()

  lab.test "Non-existent account when updating balance", (done) ->
    options = method: "POST", url: "/account/noexist/update/balance", payload: JSON.stringify({ current_balance: 100 })
    server.inject options, (response) ->
      Code.expect(response.statusCode).to.equal 400
      Code.expect(response.result.message).to.equal "Database error"
      done()

  lab.test "No payment cycle day provided", (done) ->
    options = method: "POST", url: "/account/noexist/update/payment_cycle_day"
    server.inject options, (response) ->
      Code.expect(response.statusCode).to.equal 400
      Code.expect(response.result.message).to.equal "No payment cycle day provided"
      done()

  lab.test "Non-existent account when updating payment cycle", (done) ->
    options = method: "POST", url: "/account/noexist/update/payment_cycle_day", payload: JSON.stringify({ payment_cycle_day: 10 })
    server.inject options, (response) ->
      Code.expect(response.statusCode).to.equal 400
      Code.expect(response.result.message).to.equal "Database error"
      done()

  lab.test "No payment info when adding payment", (done) ->
    options = method: "POST", url: "/account/noexist/update/add_payment"
    server.inject options, (response) ->
      Code.expect(response.statusCode).to.equal 400
      Code.expect(response.result.message).to.equal "No payment information provided"
      done()

  lab.test "Non-existent account when adding payment", (done) ->
    options = method: "POST", url: "/account/noexist/update/add_payment", payload: JSON.
      stringify({ type: 'scheduled', description: 'test', amount: 10 } )
    server.inject options, (response) ->
      Code.expect(response.statusCode).to.equal 400
      Code.expect(response.result.message).to.equal "Database error"
      done()

  lab.test "No payment info when deleting payment", (done) ->
    options = method: "POST", url: "/account/noexist/update/delete_payment"
    server.inject options, (response) ->
      Code.expect(response.statusCode).to.equal 400
      Code.expect(response.result.message).to.equal "No payment id provided"
      done()

  lab.test "Non-existent account when deleting payment", (done) ->
    options = method: "POST", url: "/account/noexist/update/delete_payment", payload: JSON.
    	stringify({ id: 100 })
    server.inject options, (response) ->
      Code.expect(response.statusCode).to.equal 400
      Code.expect(response.result.message).to.equal "Database error"
      done()

  lab.test "No payment info when updating payment", (done) ->
    options = method: "POST", url: "/account/noexist/update/update_payment"
    server.inject options, (response) ->
      Code.expect(response.statusCode).to.equal 400
      Code.expect(response.result.message).to.equal "No payment information provided"
      done()

  lab.test "Non-existent account when updating payment", (done) ->
    options = method: "POST", url: "/account/noexist/update/update_payment", payload: JSON.
    	stringify({ id: 100, description: "test", day: 20, amount: 45 })
    server.inject options, (response) ->
      Code.expect(response.statusCode).to.equal 400
      Code.expect(response.result.message).to.equal "Database error"
      done()
