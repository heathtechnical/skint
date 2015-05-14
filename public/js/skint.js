(function() {
  var sAccount;

  sAccount = (function() {
    function sAccount(data) {
      this.id = data._id;
      this.name = data.name;
      this.current_balance = data.current_balance;
      this.scheduled_payments = data.scheduled_payments;
      this.adhoc_payments = data.adhoc_payments;
      this.quickstats = data.quickstats;
      this.payment_cycle_day = data.payment_cycle_day;
    }

    sAccount.prototype.refreshDOM = function(done) {
      var add_payment_row, item, row, _ref, _ref1;
      $("body").data("id", this.id);
      $("#accountName").html(this.name);
      $("#accountPaymentsScheduled").empty();
      $("#accountPaymentsAdHoc").empty();
      add_payment_row = function(table, type, payment, skip_day) {
        var day, delete_button, link, time, time_warning, tr, tr_class;
        link = payment.description;
        time_warning = "";
        if (payment.day > 27) {
          time_warning = '<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span> ';
        }
        time = "<div>" + time_warning + payment.fuzzy + "</div>";
        tr_class = payment.isRemaining ? "success" : "";
        day = skip_day ? "" : "<td>" + time + "</td>";
        delete_button = "<button " + "data-type='" + type + "' " + "data-description='" + payment.description + "' " + "class='btn btn-xs btn-danger accountPaymentsScheduledRemoveButton'><span class='glyphicon glyphicon-trash'></span></button>";
        $(delete_button).data("foo", "bar");
        tr = "<tr class='" + tr_class + "'>" + day + "<td>" + link + "</a></td><td>£" + payment.amount.toFixed(2) + "</td><td>" + delete_button + "</td></tr>";
        return $(table).append(tr);
      };
      if (this.scheduled_payments) {
        $("#accountPaymentsScheduledPlaceholder").remove();
        _ref = this.scheduled_payments;
        for (row in _ref) {
          item = _ref[row];
          add_payment_row("#accountPaymentsScheduled", "scheduled", item);
        }
      }
      if (this.adhoc_payments) {
        $("#accountPaymentsAdHocPlaceholder").remove();
        _ref1 = this.adhoc_payments;
        for (row in _ref1) {
          item = _ref1[row];
          add_payment_row("#accountPaymentsAdHoc", "adhoc", item, true);
        }
      }
      $("#accountQuickStatsPaymentCycleDay").val(this.payment_cycle_day);
      $("#accountQuickStatsCurrentBalance").val(this.current_balance.toFixed(2));
      $("#accountQuickStatsRemainingScheduledIn").html("£" + this.quickstats.remaining_scheduled_payments[0].toFixed(2));
      $("#accountQuickStatsRemainingScheduledOut").html("£" + this.quickstats.remaining_scheduled_payments[1].toFixed(2));
      $("#accountQuickStatsRemainingAdHocIn").html("£" + this.quickstats.remaining_adhoc_payments[0].toFixed(2));
      $("#accountQuickStatsRemainingAdHocOut").html("£" + this.quickstats.remaining_adhoc_payments[1].toFixed(2));
      $("#accountQuickStatsEstimatedClosingBalance").html("£" + this.quickstats.estimated_closing_balance.toFixed(2));
      if (done) {
        return done();
      }
    };

    sAccount.fetchAccount = function(id, done) {
      return $.getJSON("/account/" + id, function(data) {
        return done(new sAccount(data));
      });
    };

    return sAccount;

  })();

  $(function() {
    sAccount.fetchAccount("54a714ca0d613b1153411300", function(account) {
      return account.refreshDOM(function() {
        return $("#accountPane").show();
      });
    });
    $("#accountQuickStatsCurrentBalanceUpdate").on("click", function() {
      return $.post("/account/" + $("body").data("id") + "/update", {
        current_balance: $("#accountQuickStatsCurrentBalance").val()
      }, function() {
        return sAccount.fetchAccount("54a714ca0d613b1153411300", function(account) {
          return account.refreshDOM();
        });
      });
    });
    $("#accountPaymentsScheduledAddButton").popover({
      html: true,
      container: 'body',
      trigger: 'manual',
      title: function() {
        return $("#popover-head").html();
      },
      content: function() {
        return $("#popover-content").html();
      }
    });
    $("body").on("click", "#accountPaymentsAddSubmitButton", function() {
      var form;
      form = $(".accountPaymentsAddForm", ".popover");
      return $.post("/account/" + $("body").data("id") + "/update", {
        'add_payment': {
          'type': $(".accountPaymentsAddType:checked", form).val(),
          'day': $(".accountPaymentsAddDay", form).val(),
          'description': $(".accountPaymentsAddDescription", form).val(),
          'amount': $(".accountPaymentsAddAmount", form).val()
        }
      }, function(data) {
        if (data.done === "success") {
          $("#accountPaymentsScheduledAddButton").popover("toggle");
          return sAccount.fetchAccount("54a714ca0d613b1153411300", function(account) {
            return account.refreshDOM();
          });
        } else if (data.done === "duplicate") {
          $(".accountPaymentsAddDescriptionControl", form).addClass("has-error");
          $(".accountPaymentsAddDescriptionControl span", form).show();
          return $(".accountPaymentsAddDescriptionHelp", form).show(100);
        } else {
          return bootbox.alert(data.message);
        }
      });
    });
    $("#accountPaymentsScheduledAddButton").on("click", function(e) {
      $("#accountPaymentsAddDeleteButton").hide();
      $(this).popover("toggle");
      return e.stopPropagation();
    });
    $("#accountQuickStatsPaymentCycleUpdate").on("click", function() {
      return $.post("/account/" + $("body").data("id") + "/update", {
        payment_cycle_day: $("#accountQuickStatsPaymentCycleDay").val()
      }, function() {
        return sAccount.fetchAccount("54a714ca0d613b1153411300", function(account) {
          return account.refreshDOM();
        });
      });
    });
    return $("body").on("click", ".accountPaymentsScheduledRemoveButton", function() {
      var payment;
      payment = {
        type: $(this).data("type"),
        description: $(this).data("description")
      };
      return $.post("/account/" + $("body").data("id") + "/update", {
        delete_payment: payment
      }, function() {
        return sAccount.fetchAccount("54a714ca0d613b1153411300", function(account) {
          return account.refreshDOM();
        });
      });
    });
  });

}).call(this);
