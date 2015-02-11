later = require 'later'
moment = require 'moment'

class paymentCycle
    constructor: (day) ->
        # Set reference moment
        @now = moment()

        # Calculate start/end moments of payment cycle
        cycle = later.parse.recur().on(day).dayOfMonth().on('00:00:00').time()
        @cycleStart = moment(later.schedule(cycle).prev(1))
        @cycleEnd = moment(later.schedule(cycle).next(1))
        @fuzzyStart = @cycleStart.from(@now)
        @fuzzyEnd = @cycleEnd.from(@now)

        console.log "Cycle: " + @cycleStart.format() + " - " + @cycleEnd.format()

        @payments = []

    addPayment: (day, description, amount) ->
        cycle = later.parse.recur().on(day).dayOfMonth()
        prev = moment(later.schedule(cycle).prev(1))
        next = moment(later.schedule(cycle).next(1)).hour(0).minute(0).second(0)

        if prev < @cycleStart and next > @cycleEnd
            console.log "No Payments Scheduled This Cycle"
    

        console.log "payment[" + description + "] = " + next.format()

        isRemaining = next.isBetween(@now, @cycleEnd)
        fuzzy = if isRemaining then next.from(@now) else prev.from(@now)

        payment = {
            day : day,
            description: description,
            amount: amount,
            next: next,
            prev: prev,
            isRemaining: isRemaining,
            fuzzy: fuzzy
        }

        @payments.push payment

        return payment

    getRemainingPayments: () ->
        payments = []

        for payment in @payments then do (payment) ->
            payments.push payment if payment.isRemaining

        return payments

    getRemainingPaymentSubtotals: () ->
        pos = neg = 0

        for payment in @getRemainingPayments() then do (payment) ->
            pos += payment.amount if payment.amount > 0
            neg += payment.amount if payment.amount < 0

        return [pos, neg]

    getAll: () ->
        return @payments

module.exports = paymentCycle
