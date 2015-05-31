(function() {
  var later, moment, paymentCycle;

  later = require('later');

  moment = require('moment');

  paymentCycle = (function() {
    function paymentCycle(day) {
      var cycle;
      this.now = moment();
      cycle = later.parse.recur().on(day).dayOfMonth().on('00:00:00').time();
      this.cycleStart = moment(later.schedule(cycle).prev(1));
      this.cycleEnd = moment(later.schedule(cycle).next(1));
      this.fuzzyStart = this.cycleStart.from(this.now);
      this.fuzzyEnd = this.cycleEnd.from(this.now);
      this.payments = [];
    }

    paymentCycle.prototype.addPayment = function(day, description, amount) {
      var cycle, fuzzy, isRemaining, next, payment, prev;
      cycle = later.parse.recur().on(day).dayOfMonth();
      prev = moment(later.schedule(cycle).prev(1));
      next = moment(later.schedule(cycle).next(1)).hour(0).minute(0).second(0);
      isRemaining = next.isBetween(this.now, this.cycleEnd);
      fuzzy = isRemaining ? next.from(this.now) : prev.from(this.now);
      payment = {
        day: day,
        description: description,
        amount: amount,
        next: next,
        prev: prev,
        isRemaining: isRemaining,
        fuzzy: fuzzy
      };
      this.payments.push(payment);
      return payment;
    };

    paymentCycle.prototype.getRemainingPayments = function() {
      var payment, payments, _fn, _i, _len, _ref;
      payments = [];
      _ref = this.payments;
      _fn = function(payment) {
        if (payment.isRemaining) {
          return payments.push(payment);
        }
      };
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        payment = _ref[_i];
        _fn(payment);
      }
      return payments;
    };

    paymentCycle.prototype.getRemainingPaymentSubtotals = function() {
      var neg, payment, pos, _fn, _i, _len, _ref;
      pos = neg = 0;
      _ref = this.getRemainingPayments();
      _fn = function(payment) {
        if (payment.amount > 0) {
          pos += payment.amount;
        }
        if (payment.amount < 0) {
          return neg += payment.amount;
        }
      };
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        payment = _ref[_i];
        _fn(payment);
      }
      return [pos, neg];
    };

    paymentCycle.prototype.getAll = function() {
      return this.payments;
    };

    return paymentCycle;

  })();

  module.exports = paymentCycle;

}).call(this);
