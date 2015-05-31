(function() {
  var SkintApp;

  SkintApp = angular.module('SkintApp', ['ui.bootstrap', 'ngRoute', 'ngAnimate', 'SkintControllers', 'SkintServices']);

  SkintApp.config(function($routeProvider, $interpolateProvider) {
    $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
    return $routeProvider.when('/:accountId', {});
  });

}).call(this);
