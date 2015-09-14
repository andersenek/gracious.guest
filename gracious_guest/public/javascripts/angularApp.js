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
      })

      .state('events', {
        url: '/events/{id}',
        templateUrl: '/events.html',
        controller: 'EventsCtrl'
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
      if(!$scope.title || $scope.title === '') {  // Prevent the user from entering a blank title
        return;
      }

      $scope.events.push({
        title: $scope.title,
        link: $scope.link,
        comments: [
          {author: 'Erica', body: 'This is so cool'},
          {author: 'Kanye', body: 'Woah this is awwwwesome'}
        ]
      });

      $scope.title = ''; // Set area to empty when done
      $scope.link = ''; // Set area to empty when done
    };

  }]); // End MainCtrl controller

app.controller('EventsCtrl', [
  '$scope',
  '$stateParams',
  'events', // Need access events so we can retreive the ID

  function($scope, $stateParams, events){

    $scope.event = events.events[$stateParams.id];

    $scope.addComment = function(){
      if($scope.body === '') { // Prevent the user from entering a blank body
        return;
       }

      $scope.event.comments.push({ // Comment will post to an event
        body: $scope.body,
        author: 'user'
      });

      $scope.body = ''; // Set area to empty when done
    };

}]); // End EventsCtrl controller
