var app = angular.module('graciousGuest', ['ui.router']);

app.config([
  '$stateProvider',
  '$urlRouterProvider',

  function($stateProvider, $urlRouterProvider) {

    $stateProvider
      .state('home', {
        url: '/home',
        templateUrl: '/home.html',
        controller: 'MainCtrl',
        resolve: {
          eventPromise: ['events', function(events){
            return events.getAll();
          }]
        }
      })

      .state('events', {
        url: '/events/{id}',
        templateUrl: '/events.html',
        controller: 'EventsCtrl',
        resolve: {
          event: ['$stateParams', 'events', function($stateParams, events) {
            return events.get($stateParams.id);
          }]
        }
      });

    $urlRouterProvider.otherwise('home'); // Redirect to home

}]); // End app.config

app.factory('events', ['$http', function($http){ // Inject http and pass in function

  var o = {
    events: []
  };

  o.get = function(id) {
    return $http.get('/events/' + id).then(function(res){
      return res.data;
    });
  };

  o.getAll = function() {
    return $http.get('/events').success(function(data){ // Gets event data
      angular.copy(data, o.events); // Copies data to event
    });
  };
  o.create = function(event) {
    return $http.post('/events', event).success(function(data){ // Post to server
      o.events.push(data); // Add data to our post array
    });
  };

  o.addComment = function(id, comment) {
    return $http.post('/events/' + id + '/comments', comment);
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

      events.create({
        title: $scope.title,
        link: $scope.link,
      });

      $scope.title = ''; // Set area to empty when done
      $scope.link = ''; // Set area to empty when done
    };

  }]); // End MainCtrl controller

app.controller('EventsCtrl', [
  '$scope',
  'events', // Need access events so we can retreive the ID
  'event', // To access an event from state

  function($scope, events, event){

    $scope.event = event;

    $scope.addComment = function(){
      if($scope.body === '') { // Prevent the user from entering a blank body
        return;
      }
      events.addComment(event._id, {
        body: $scope.body,
        author: 'user',
      }).success(function(comment) {
        $scope.event.comments.push(comment); // Comment will post to an event
      });
      $scope.body = ''; // Set area to empty when done
    };

}]); // End EventsCtrl controller
