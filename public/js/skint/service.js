(function() {
  var SkintServices;

  SkintServices = angular.module('SkintServices', ['ngResource']);

  SkintServices.factory('Account', [
    '$resource', function($resource) {
      return $resource('/account/:accountId', {}, {
        getAccounts: {
          method: 'GET',
          isArray: true
        },
        update: {
          method: 'POST',
          params: {
            accountId: '@accountId',
            action: '@action'
          },
          url: '/account/:accountId/update/:action'
        }
      });
    }
  ]);

}).call(this);
