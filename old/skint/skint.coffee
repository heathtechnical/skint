class sAccount
    constructor: (data) ->
        @id = data._id
        @name = data.name
        @current_balance = data.current_balance
        @scheduled_payments = data.scheduled_payments
        @adhoc_payments = data.adhoc_payments
        @quickstats = data.quickstats 
        @payment_cycle_day = data.payment_cycle_day

    refreshDOM: (done) ->
        $("body").data("id", @id)
        $("#accountName").html(@name)

        $("#accountPaymentsScheduled").empty()
        $("#accountPaymentsAdHoc").empty()

        add_payment_row = (table, payment, skip_day) ->
            link = payment.description
            time_warning = ""
            if payment.day > 27
                time_warning = '<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span> '
            time = "<div>" + time_warning + payment.fuzzy + "</div>"

            tr_class = if payment.isRemaining then "success" else ""

            day = if skip_day then "" else "<td>" + time + "</td>"

            tr = "<tr class='"+tr_class+"'>" + day +
                "<td>" + link + "</a></td><td>£" + 
                payment.amount.toFixed(2) + "</td><td><button data-day='"+payment.day+"' data-description='"+payment.description+"' class='btn btn-xs btn-danger accountPaymentsScheduledRemoveButton'><span class='glyphicon glyphicon-trash'></span></button></td></tr>"

            console.log $("button", tr)

            $(table)
            .append(tr)



        if @scheduled_payments
            $("#accountPaymentsScheduledPlaceholder").remove()
            add_payment_row("#accountPaymentsScheduled", item) for row, item of @scheduled_payments

        if @adhoc_payments
            $("#accountPaymentsAdHocPlaceholder").remove()
            add_payment_row("#accountPaymentsAdHoc", item, true) for row, item of @adhoc_payments

        $("#accountQuickStatsPaymentCycleDay").val(@payment_cycle_day)
        $("#accountQuickStatsCurrentBalance").val(@current_balance.toFixed(2))
        $("#accountQuickStatsRemainingScheduledIn").html("£" + @quickstats.remaining_scheduled_payments[0].toFixed(2))
        $("#accountQuickStatsRemainingScheduledOut").html("£" + @quickstats.remaining_scheduled_payments[1].toFixed(2))
        $("#accountQuickStatsRemainingAdHocIn").html("£" + @quickstats.remaining_adhoc_payments[0].toFixed(2))
        $("#accountQuickStatsRemainingAdHocOut").html("£" + @quickstats.remaining_adhoc_payments[1].toFixed(2))
        $("#accountQuickStatsEstimatedClosingBalance").html("£" + @quickstats.estimated_closing_balance.toFixed(2))

        done() if done

    @fetchAccount: (id, done) ->
        $.getJSON "/account/" + id, (data) ->
            console.log data
            done new sAccount data


$ ->
    sAccount.fetchAccount "54a714ca0d613b1153411300", (account) ->
        account.refreshDOM () ->
            $("#accountPane").show()

    $("#accountQuickStatsCurrentBalanceUpdate").on "click", () ->
        $.post "/account/" + $("body").data("id") + "/update", current_balance: $("#accountQuickStatsCurrentBalance").val(), () ->
            sAccount.fetchAccount "54a714ca0d613b1153411300", (account) ->
                account.refreshDOM()

    $("#accountPaymentsScheduledAddButton").popover({
            html : true,
            container: 'body',
            trigger: 'manual',
            title: () ->
                return $("#popover-head").html()
            content: () ->
                return $("#popover-content").html()
    })
    
    $("body").on "click", "#accountPaymentsAddSubmitButton", () ->
        form = $(".accountPaymentsAddForm", ".popover")
        $.post "/account/" + $("body").data("id") + "/update", {
                'add_payment': {
                    'type': $(".accountPaymentsAddType:checked", form).val(),
                    'day': $(".accountPaymentsAddDay", form).val(),
                    'description': $(".accountPaymentsAddDescription", form).val(),
                    'amount': $(".accountPaymentsAddAmount", form).val()
                }
        }, (data) ->
            if data.done == "success"
                $("#accountPaymentsScheduledAddButton").popover("toggle")
                sAccount.fetchAccount "54a714ca0d613b1153411300", (account) ->
                    account.refreshDOM()
            else if data.done == "duplicate"
                $(".accountPaymentsAddDescriptionControl", form).addClass("has-error")
                $(".accountPaymentsAddDescriptionControl span", form).show()
                $(".accountPaymentsAddDescriptionHelp", form).show(100)
            else
                bootbox.alert(data.message)
        
    $("#accountPaymentsScheduledAddButton").on "click", (e) ->
        $("#accountPaymentsAddDeleteButton").hide()

        $(this).popover("toggle")
        e.stopPropagation()

    $("#accountQuickStatsPaymentCycleUpdate").on "click", () ->
        $.post "/account/" + $("body").data("id") + "/update", payment_cycle_day: $("#accountQuickStatsPaymentCycleDay").val(), () ->
            sAccount.fetchAccount "54a714ca0d613b1153411300", (account) ->
                account.refreshDOM()

    $("body").on "click", ".accountPaymentsScheduledRemoveButton", () ->
        day = $(this).data("day")
        description = $(this).data("description")

        $.post "/account/" + $("body").data("id") + "/update", delete_payment: { day: day, description: description }, () ->
            sAccount.fetchAccount "54a714ca0d613b1153411300", (account) ->
                account.refreshDOM()
