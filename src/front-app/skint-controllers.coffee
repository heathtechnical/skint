skApp = angular.module('skApp', ['ngCookies']).config ($interpolateProvider) ->
    $interpolateProvider.startSymbol('{[{').endSymbol('}]}')

skApp.controller 'skMoneyTracker', ($scope, $http, $cookieStore, $rootScope) ->
    $scope.$watch 'accountID', (val) ->
        $cookieStore.put "accountID", $scope.accountID if val

    $scope.refresh = () ->
        $http.get('/account').success (data) ->
            $scope.accountList = data
        
            # Set initial account ID
            if not $scope.accountID
                cAccountID = $cookieStore.get "accountID"
                if not cAccountID
                    cAccountID = $scope.accountList[0]['_id'] 

                # TODO: If we have no accountID's then do something
                # TODO: If cookie accountID doesn't exist in the list, error
                    
                $scope.accountID = cAccountID

            $http.get('/account/' + $scope.accountID).success (data) ->
                $scope.account = data

                $scope.paymentCycleDay = $scope.account.payment_cycle_day
                $scope.currentBalance = $scope.account.current_balance

    $scope.deletePayment = (payment) ->
        $http.post("/account/" + $scope.accountID + "/update", {
            delete_payment: payment
        }).success(() ->
            $scope.refresh()
        )

    $scope.updatePaymentCycleDay = (day) ->
        $http.post("/account/" + $scope.accountID + "/update", {
            payment_cycle_day: day
        }).success(() ->
            $scope.refresh()
        )

    $scope.updateCurrentBalance = (balance) ->
        $http.post("/account/" + $scope.accountID + "/update", {
            current_balance: balance
        }).success(() ->
            $scope.refresh()
        )

    $scope.switchAccount = (id) ->
        $scope.accountID = id
        $scope.refresh()

    $scope.editPayment = (payment) ->
        angular.forEach($scope.account.scheduled_payments, (opayment) -> opayment.editMode = false)
        $scope.newPayment = payment
        payment.editMode = true

    $scope.saveEditPayment = (payment) ->
        angular.forEach($scope.account.scheduled_payments, (opayment) -> opayment.editMode = false)

        $http.post("/account/" + $scope.accountID + "/update", {
            update_payment: payment
        }).success(() ->
            $scope.refresh()
        )

    $scope.refresh()

skApp.directive 'skAddPaymentPopover', ($compile, $templateCache, $http, $rootScope) ->
    return {
        restrict: 'A',
        link: (scope, element, attrs) ->
            scope.newPayment = 
                type: "scheduled"

            scope.addPaymentButton = (payment) ->
                $http.post("/account/" + scope.accountID + "/update", {
                    add_payment: payment
                }).success(() ->
                    scope.refresh()
                    $(element).popover('toggle')
                )

            $(element).popover
                container: "body"
                content: $compile($templateCache.get("addPaymentPopover.html"))(scope)
                title: "Add Payment"
                placement: "right"
                html: true
    }

skApp.directive 'skAddAccountPopover', ($compile, $templateCache, $http, $rootScope) ->
    return {
        restrict: 'A',
        link: (scope, element, attrs) ->

            scope.addAccountButton = (account) ->
                $http.post("/account", {
                    account_name: account.name
                }).success((data) ->
                    scope.accountID = data.account_id
                    scope.refresh()

                    $(element).popover('toggle')
                )

            $(element).popover
                container: "body"
                content: $compile($templateCache.get("addAccountPopover.html"))(scope)
                title: "Add Account"
                placement: "bottom"
                html: true
    }

skApp.directive 'skAccountChart', ($compile, $http, $timeout) ->
    return {
        restrict: 'A',
        link: (scope, element, attrs) ->

            chart = $(element).highcharts
                chart: { type: 'spline' },
                title: { text: 'Account Balance Summary' },
                subtitle: { text: 'Irregular time data in Highcharts JS' },
                xAxis: {
                    type: 'datetime',
                    dateTimeLabelFormats: {
                        month: '%e. %b',
                        year: '%b'
                    },
                    title: {
                        text: 'Date'
                    }
                },
                yAxis: {
                    title: {
                        text: 'Balance'
                    }
                },
                tooltip: {
                    headerFormat: '<b>{series.name}</b><br>',
                    pointFormat: '{point.x}: {point.y:.2f}'
                }
                series: [{
                    name: 'This Cycle',
                    data: []
                }]

            scope.$watch 'account', (account) ->
                if account
                    data = account.historic_balance.map (v) ->
                        return [new Date(v.date).getTime(), v.balance]

                    chart = $(element).highcharts()
                    chart.series[0].setData(data)

            renderChart = () ->
                $(element).highcharts({
                    chart: { type: 'spline' },
                    title: { text: 'Snow depth at Vikjafjellet, Norway' },
                    subtitle: { text: 'Irregular time data in Highcharts JS' },
                    xAxis: {
                        type: 'datetime',
                        dateTimeLabelFormats: {
                            month: '%e. %b',
                            year: '%b'
                        },
                        title: {
                            text: 'Date'
                        }
                    },
                    yAxis: {
                        title: {
                            text: 'Snow depth (m)'
                        },
                        min: 0
                    },
                    tooltip: {
                        headerFormat: '<b>{series.name}</b><br>',
                        pointFormat: '{point.x:%e. %b}: {point.y:.2f} m'
                    },
                    series: [{
                        name: 'Winter 2007-2008',
                        data: [
                            [Date.UTC(1970,  9, 27), 0   ],
                            [Date.UTC(1970, 10, 10), 0.6 ],
                            [Date.UTC(1970, 10, 18), 0.7 ],
                            [Date.UTC(1970, 11,  2), 0.8 ],
                            [Date.UTC(1970, 11,  9), 0.6 ],
                            [Date.UTC(1970, 11, 16), 0.6 ],
                            [Date.UTC(1970, 11, 28), 0.67],
                            [Date.UTC(1971,  0,  1), 0.81],
                            [Date.UTC(1971,  0,  8), 0.78],
                            [Date.UTC(1971,  5,  9), 0.25],
                            [Date.UTC(), scope.account.current_balance ]
                        ]
                    }]
                })
    }
