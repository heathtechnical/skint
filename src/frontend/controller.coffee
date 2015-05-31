SkintControllers = angular.module 'SkintControllers', []

SkintControllers.controller 'AppController', ['$scope', '$route', '$routeParams', 'Account', ($scope, $route, $routeParams, Account) ->
  $scope.alerts = []

  $scope.closeAlert = (index) ->
    $scope.alerts.splice(index, 1)

  $scope.refresh = (id) ->
    $scope.accountId = id

    Account.get { accountId: id }, (account) ->
      $scope.account = account

  Account.getAccounts (accounts) ->
    $scope.accounts = accounts
    if not $routeParams.accountId
      $scope.refresh(accounts[0]._id)

  $scope.$on "$routeChangeSuccess", ($currentRoute, $previousRoute) ->
    $scope.refresh($routeParams.accountId)

]

SkintControllers.controller 'PaymentsCtrl', [ '$scope', '$timeout', 'Account', ($scope, $timeout, Account) ->
  $scope.params = {
    new: { type: 'scheduled' },
    addPaymentTemplateUrl: 'addPaymentTemplate.html'
  }

  $scope.addPayment = (payment) ->
    Account.update({
      action: 'add_payment',
      accountId: $scope.accountId,
      type: payment.type,
      description: payment.description,
      amount: payment.amount,
      day: payment.day
    }, (success) ->
      $timeout(
        () -> $(".sk-add-payment").trigger('click')
      , 0)
      $scope.alerts.push { type: "success", icon: "ok", msg: "Payment added successfully" }
      payment.amount = payment.description = payment.day = null
      $scope.refresh($scope.accountId)
    , (err) ->
      $scope.alerts.push { type: "danger", icon: "remove", msg: "Unable to add payment, please try again" }
    )


  $scope.editPayment = (payment) ->
    angular.forEach($scope.account.payments, (p) -> p.editMode = false)
    payment.editMode = true

  $scope.saveEditPayment = (payment) ->
    Account.update({
      accountId: $scope.accountId,
      action: 'update_payment'
      description: payment.description,
      day: payment.day,
      amount: payment.amount,
      id: payment.id
    }, (success) ->
      angular.forEach($scope.account.payments, (p) -> p.editMode = false)
      $scope.alerts.push { type: "success", icon: "ok", msg: "Payment saved successfully" }
      $scope.refresh($scope.accountId)
    (err) ->
      $scope.alerts.push { type: "danger", icon: "remove", msg: "Unable to save payment, please try again" }
    )

  $scope.deletePayment = (payment) ->
    Account.update({ accountId: $scope.accountId, action: 'delete_payment', id: payment.id }, (success) ->
      $scope.alerts.push { type: "success", icon: "ok", msg: "Payment removed successfully" }
      angular.forEach($scope.account.payments, (p) -> p.editMode = false)
      $scope.refresh($scope.accountId)
    (err) ->
      $scope.alerts.push { type: "danger", icon: "remove", msg: "Unable to remove payment, please try again" }
    )
]

SkintControllers.controller 'AccountsCtrl', [ '$scope', '$timeout', '$modal', 'Account', ($scope, $timeout, $modal, Account) ->
  $scope.params = {
    days: [ "Last Day Of Month" ],
    updateCurrentBalanceTemplateUrl: 'updateCurrentBalanceTemplate.html',
    new_account_name: "",
    new_payment_cycle_day: 0,
    new_current_balance: 0
  }

  for i in [1..29]
    $scope.params.days.push i

  $scope.updateCurrentBalancePopover = () ->
    $scope.params.new_current_balance = $scope.account.current_balance

  $scope.updateCurrentBalanceCommit = () ->
    Account.update({ accountId: $scope.accountId, action: 'balance', 'current_balance': $scope.params.new_current_balance }, (success) ->
      $timeout(() ->
        $(".sk-balance").trigger('click')
      , 0)
      $scope.alerts.push { type: "success", icon: "ok", msg: "Balance successfully updated" }
      $scope.refresh $scope.accountId
    , (err) ->
      $scope.alerts.push { type: "danger", icon: "remove", msg: "Unable to update balance, please try again" }
    )

  $scope.openAccountSettings = (isNew) ->
    if isNew
      $scope.params.is_new = true
      $scope.params.new_account_name = ""
      $scope.params.new_payment_cycle_day = 1
    else
      $scope.params.is_new = false
      $scope.params.new_account_name = $scope.account.name
      $scope.params.new_payment_cycle_day = $scope.account.payment_cycle_day

    modalInstance = $modal.open({
      animation: true,
      templateUrl: 'accountSettingsModalTemplate.html',
      controller: "AccountSettingsCtrl",
      scope: $scope,
      size: 300
    })

]

SkintControllers.controller 'AccountSettingsCtrl', [ '$scope', '$modalInstance', 'Account', ($scope, $modalInstance, Account) ->
  $scope.saveAccountSettings = () ->
    if $scope.params.is_new
      Account.save({
        account_name: $scope.params.new_account_name,
        payment_cycle_day: $scope.params.new_payment_cycle_day
      }, (success) ->
        $scope.alerts.push { type: "success", icon: "ok", msg: "Account added successfully" }
        $modalInstance.dismiss 'cancel'
        $scope.refresh $scope.accountId
      )
      return

    Account.update({ accountId: $scope.accountId, action: 'payment_cycle_day', 'payment_cycle_day': $scope.params.new_payment_cycle_day}, (success) ->
      Account.update({ accountId: $scope.accountId, action: 'account_name', 'account_name': $scope.params.new_account_name}, (success) ->
        $scope.alerts.push { type: "success", icon: "ok", msg: "Account settings updated successfully" }
        $scope.refresh $scope.accountId
        $modalInstance.dismiss 'cancel'
      , (err) ->
        $scope.alerts.push { type: "danger", icon: "remove", msg: "Unable to save account settings, please try again" }
        $modalInstance.dismiss 'cancel'
      )
    , (err) ->
      $scope.alerts.push { type: "danger", icon: "remove", msg: "Unable to save account settings, please try again" }
      $modalInstance.dismiss 'cancel'
    )

  $scope.cancelAccountSettings = () ->
    $modalInstance.dismiss 'cancel'
]
