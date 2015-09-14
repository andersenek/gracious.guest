var app = angular.module('graciousGuest', ['ui.router']);

app.config([
  '$stateProvider',
  '$urlRouterProvider',

  function($stateProvider, $urlRouterProvider) {

    $stateProvider
      .state('home', {
        url: '/home',
        templateUrl: '/home.html',
        controller: 'MainCtrl'
      });

    $urlRouterProvider.otherwise('home'); // Redirect to home

}]); // End app.config

app.factory('events', [function(){

  var o = {
    events: []
  };
  return o;
  // End Service Body
}]);

// Create a new controller for index.html
app.controller('MainCtrl', [
  '$scope',
  'events',

  function($scope, events){

    $scope.events = events.events; // Bind the $scope.events variable in our controller to the events array in our service

    $scope.addEvent = function(){ // Allow user to add a event
      if(!$scope.title || $scope.title === '') {  // Prevent the user from eventing a blank title
        return;
      }

      $scope.events.push({
        title: $scope.title,
        link: $scope.link,
        upvotes: 0
      });

      $scope.title = '';
      $scope.link = '';
    };

  }]); // End MainCtrl controller
