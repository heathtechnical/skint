(function() {
  var skApp;

  skApp = angular.module('skApp', ['ngCookies']).config(function($interpolateProvider) {
    return $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
  });

  skApp.controller('skMoneyTracker', function($scope, $http, $cookieStore, $rootScope) {
    $scope.$watch('accountID', function(val) {
      if (val) {
        return $cookieStore.put("accountID", $scope.accountID);
      }
    });
    $scope.refresh = function() {
      return $http.get('/account').success(function(data) {
        var cAccountID;
        $scope.accountList = data;
        if (!$scope.accountID) {
          cAccountID = $cookieStore.get("accountID");
          if (!cAccountID) {
            cAccountID = $scope.accountList[0]['_id'];
          }
          $scope.accountID = cAccountID;
        }
        return $http.get('/account/' + $scope.accountID).success(function(data) {
          $scope.account = data;
          $scope.paymentCycleDay = $scope.account.payment_cycle_day;
          return $scope.currentBalance = $scope.account.current_balance;
        });
      });
    };
    $scope.deletePayment = function(payment) {
      return $http.post("/account/" + $scope.accountID + "/update", {
        delete_payment: payment
      }).success(function() {
        return $scope.refresh();
      });
    };
    $scope.updatePaymentCycleDay = function(day) {
      return $http.post("/account/" + $scope.accountID + "/update", {
        payment_cycle_day: day
      }).success(function() {
        return $scope.refresh();
      });
    };
    $scope.updateCurrentBalance = function(balance) {
      return $http.post("/account/" + $scope.accountID + "/update", {
        current_balance: balance
      }).success(function() {
        return $scope.refresh();
      });
    };
    $scope.switchAccount = function(id) {
      $scope.accountID = id;
      return $scope.refresh();
    };
    $scope.editPayment = function(payment) {
      angular.forEach($scope.account.scheduled_payments, function(opayment) {
        return opayment.editMode = false;
      });
      $scope.newPayment = payment;
      return payment.editMode = true;
    };
    $scope.saveEditPayment = function(payment) {
      angular.forEach($scope.account.scheduled_payments, function(opayment) {
        return opayment.editMode = false;
      });
      return $http.post("/account/" + $scope.accountID + "/update", {
        update_payment: payment
      }).success(function() {
        return $scope.refresh();
      });
    };
    return $scope.refresh();
  });

  skApp.directive('skAddPaymentPopover', function($compile, $templateCache, $http, $rootScope) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        scope.newPayment = {
          type: "scheduled"
        };
        scope.addPaymentButton = function(payment) {
          return $http.post("/account/" + scope.accountID + "/update", {
            add_payment: payment
          }).success(function() {
            scope.refresh();
            return $(element).popover('toggle');
          });
        };
        return $(element).popover({
          container: "body",
          content: $compile($templateCache.get("addPaymentPopover.html"))(scope),
          title: "Add Payment",
          placement: "right",
          html: true
        });
      }
    };
  });

  skApp.directive('skAddAccountPopover', function($compile, $templateCache, $http, $rootScope) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        scope.addAccountButton = function(account) {
          return $http.post("/account", {
            account_name: account.name
          }).success(function(data) {
            scope.accountID = data.account_id;
            scope.refresh();
            return $(element).popover('toggle');
          });
        };
        return $(element).popover({
          container: "body",
          content: $compile($templateCache.get("addAccountPopover.html"))(scope),
          title: "Add Account",
          placement: "bottom",
          html: true
        });
      }
    };
  });

  skApp.directive('skAccountChart', function($compile, $http, $timeout) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var chart, renderChart;
        chart = $(element).highcharts({
          chart: {
            type: 'spline'
          },
          title: {
            text: 'Account Balance Summary'
          },
          subtitle: {
            text: 'Irregular time data in Highcharts JS'
          },
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
          },
          series: [
            {
              name: 'This Cycle',
              data: []
            }
          ]
        });
        scope.$watch('account', function(account) {
          var data;
          if (account) {
            data = account.historic_balance.map(function(v) {
              return [new Date(v.date).getTime(), v.balance];
            });
            chart = $(element).highcharts();
            return chart.series[0].setData(data);
          }
        });
        return renderChart = function() {
          return $(element).highcharts({
            chart: {
              type: 'spline'
            },
            title: {
              text: 'Snow depth at Vikjafjellet, Norway'
            },
            subtitle: {
              text: 'Irregular time data in Highcharts JS'
            },
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
            series: [
              {
                name: 'Winter 2007-2008',
                data: [[Date.UTC(1970, 9, 27), 0], [Date.UTC(1970, 10, 10), 0.6], [Date.UTC(1970, 10, 18), 0.7], [Date.UTC(1970, 11, 2), 0.8], [Date.UTC(1970, 11, 9), 0.6], [Date.UTC(1970, 11, 16), 0.6], [Date.UTC(1970, 11, 28), 0.67], [Date.UTC(1971, 0, 1), 0.81], [Date.UTC(1971, 0, 8), 0.78], [Date.UTC(1971, 5, 9), 0.25], [Date.UTC(), scope.account.current_balance]]
              }
            ]
          });
        };
      }
    };
  });

}).call(this);
