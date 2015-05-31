SkintApp = angular.module('SkintApp', ['ui.bootstrap', 'ngRoute', 'ngAnimate', 'SkintControllers', 'SkintServices'])
	
#SkintApp.config ['$routeProvider', '$interpolateProvider', ($routeProvider, $interpolateProvider) ->
SkintApp.config ($routeProvider, $interpolateProvider) ->
  $interpolateProvider.startSymbol('{[{').endSymbol('}]}')
  $routeProvider.when('/:accountId', {})
