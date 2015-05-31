(function() {
  var SkintControllers;

  SkintControllers = angular.module('SkintControllers', []);

  SkintControllers.controller('AppController', [
    '$scope', '$route', '$routeParams', 'Account', function($scope, $route, $routeParams, Account) {
      $scope.alerts = [];
      $scope.closeAlert = function(index) {
        return $scope.alerts.splice(index, 1);
      };
      $scope.refresh = function(id) {
        return Account.getAccounts(function(accounts) {
          $scope.accounts = accounts;
          if (!id) {
            $scope.accountId = accounts[0]._id;
          } else {
            $scope.accountId = id;
          }
          return Account.get({
            accountId: $scope.accountId
          }, function(account) {
            return $scope.account = account;
          });
        });
      };
      $scope.$on("$routeChangeSuccess", function($currentRoute, $previousRoute) {
        return $scope.refresh($routeParams.accountId);
      });
      return $scope.refresh();
    }
  ]);

  SkintControllers.controller('PaymentsCtrl', [
    '$scope', '$timeout', 'Account', function($scope, $timeout, Account) {
      $scope.params = {
        "new": {
          type: 'scheduled'
        },
        addPaymentTemplateUrl: 'addPaymentTemplate.html'
      };
      $scope.addPayment = function(payment) {
        return Account.update({
          action: 'add_payment',
          accountId: $scope.accountId,
          type: payment.type,
          description: payment.description,
          amount: payment.amount,
          day: payment.day
        }, function(success) {
          $timeout(function() {
            return $(".sk-add-payment").trigger('click');
          }, 0);
          $scope.alerts.push({
            type: "success",
            icon: "ok",
            msg: "Payment added successfully"
          });
          payment.amount = payment.description = payment.day = null;
          return $scope.refresh($scope.accountId);
        }, function(err) {
          return $scope.alerts.push({
            type: "danger",
            icon: "remove",
            msg: "Unable to add payment, please try again"
          });
        });
      };
      $scope.editPayment = function(payment) {
        angular.forEach($scope.account.payments, function(p) {
          return p.editMode = false;
        });
        return payment.editMode = true;
      };
      $scope.saveEditPayment = function(payment) {
        return Account.update({
          accountId: $scope.accountId,
          action: 'update_payment',
          description: payment.description,
          day: payment.day,
          amount: payment.amount,
          id: payment.id
        }, function(success) {
          angular.forEach($scope.account.payments, function(p) {
            return p.editMode = false;
          });
          $scope.alerts.push({
            type: "success",
            icon: "ok",
            msg: "Payment saved successfully"
          });
          return $scope.refresh($scope.accountId);
        }, function(err) {
          return $scope.alerts.push({
            type: "danger",
            icon: "remove",
            msg: "Unable to save payment, please try again"
          });
        });
      };
      return $scope.deletePayment = function(payment) {
        return Account.update({
          accountId: $scope.accountId,
          action: 'delete_payment',
          id: payment.id
        }, function(success) {
          $scope.alerts.push({
            type: "success",
            icon: "ok",
            msg: "Payment removed successfully"
          });
          angular.forEach($scope.account.payments, function(p) {
            return p.editMode = false;
          });
          return $scope.refresh($scope.accountId);
        }, function(err) {
          return $scope.alerts.push({
            type: "danger",
            icon: "remove",
            msg: "Unable to remove payment, please try again"
          });
        });
      };
    }
  ]);

  SkintControllers.controller('AccountsCtrl', [
    '$scope', '$timeout', '$modal', 'Account', function($scope, $timeout, $modal, Account) {
      var i, _i;
      $scope.params = {
        days: ["Last Day Of Month"],
        updateCurrentBalanceTemplateUrl: 'updateCurrentBalanceTemplate.html',
        new_account_name: "",
        new_payment_cycle_day: 0,
        new_current_balance: 0
      };
      for (i = _i = 1; _i <= 29; i = ++_i) {
        $scope.params.days.push(i);
      }
      $scope.updateCurrentBalancePopover = function() {
        return $scope.params.new_current_balance = $scope.account.current_balance;
      };
      $scope.updateCurrentBalanceCommit = function() {
        return Account.update({
          accountId: $scope.accountId,
          action: 'balance',
          'current_balance': $scope.params.new_current_balance
        }, function(success) {
          $timeout(function() {
            return $(".sk-balance").trigger('click');
          }, 0);
          $scope.alerts.push({
            type: "success",
            icon: "ok",
            msg: "Balance successfully updated"
          });
          return $scope.refresh($scope.accountId);
        }, function(err) {
          return $scope.alerts.push({
            type: "danger",
            icon: "remove",
            msg: "Unable to update balance, please try again"
          });
        });
      };
      return $scope.openAccountSettings = function(isNew) {
        var modalInstance;
        if (isNew) {
          $scope.params.is_new = true;
          $scope.params.new_account_name = "";
          $scope.params.new_payment_cycle_day = 1;
        } else {
          $scope.params.is_new = false;
          $scope.params.new_account_name = $scope.account.name;
          $scope.params.new_payment_cycle_day = $scope.account.payment_cycle_day;
        }
        return modalInstance = $modal.open({
          animation: true,
          templateUrl: 'accountSettingsModalTemplate.html',
          controller: "AccountSettingsCtrl",
          scope: $scope,
          size: 300
        });
      };
    }
  ]);

  SkintControllers.controller('AccountSettingsCtrl', [
    '$scope', '$modalInstance', 'Account', function($scope, $modalInstance, Account) {
      $scope.saveAccountSettings = function() {
        if ($scope.params.is_new) {
          Account.save({
            account_name: $scope.params.new_account_name,
            payment_cycle_day: $scope.params.new_payment_cycle_day
          }, function(success) {
            $scope.alerts.push({
              type: "success",
              icon: "ok",
              msg: "Account added successfully"
            });
            $modalInstance.dismiss('cancel');
            return $scope.refresh($scope.accountId);
          });
          return;
        }
        return Account.update({
          accountId: $scope.accountId,
          action: 'payment_cycle_day',
          'payment_cycle_day': $scope.params.new_payment_cycle_day
        }, function(success) {
          return Account.update({
            accountId: $scope.accountId,
            action: 'account_name',
            'account_name': $scope.params.new_account_name
          }, function(success) {
            $scope.alerts.push({
              type: "success",
              icon: "ok",
              msg: "Account settings updated successfully"
            });
            $scope.refresh($scope.accountId);
            return $modalInstance.dismiss('cancel');
          }, function(err) {
            $scope.alerts.push({
              type: "danger",
              icon: "remove",
              msg: "Unable to save account settings, please try again"
            });
            return $modalInstance.dismiss('cancel');
          });
        }, function(err) {
          $scope.alerts.push({
            type: "danger",
            icon: "remove",
            msg: "Unable to save account settings, please try again"
          });
          return $modalInstance.dismiss('cancel');
        });
      };
      return $scope.cancelAccountSettings = function() {
        return $modalInstance.dismiss('cancel');
      };
    }
  ]);

  SkintControllers.directive('skChart', [
    '$compile', '$http', '$timeout', function($compile, $http, $timeout) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          var chart;
          chart = $(element).highcharts({
            credits: {
              enabled: false
            },
            chart: {
              type: 'spline'
            },
            title: {
              text: 'Account Balance Summary'
            },
            subtitle: {
              text: 'All time'
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
              formatter: function() {
                return '<b>' + this.series.name + '</b><br>' + Highcharts.dateFormat('%e %b %Y', new Date(this.x)) + ' £' + this.y;
              }
            },
            series: [
              {
                name: 'Account Balance',
                data: []
              }
            ]
          });
          return scope.$watch('account', function(account) {
            var data;
            if (account) {
              data = account.historic_balance.map(function(v) {
                return [new Date(v.date).getTime(), v.balance];
              });
              chart = $(element).highcharts();
              return chart.series[0].setData(data);
            }
          });
        }
      };
    }
  ]);

}).call(this);
