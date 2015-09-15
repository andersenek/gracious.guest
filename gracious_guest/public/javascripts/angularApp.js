var app = angular.module('graciousGuest', ['ui.router']);

// Routes
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

// Factories

app.factory('auth', ['$http', '$window', function($http, $window){
  var auth = {};

  auth.saveToken = function (token){
    $window.localStorage['gracious-guest-token'] = token; // Access window because this is where localStorage key will be // * Don't change or else everyone will be logged out
  };

  auth.getToken = function (){
    return $window.localStorage['gracious-guest-token'];
  }

  auth.isLoggedIn = function(){
    var token = auth.getToken();

    if(token){ // If the token is there
      var payload = JSON.parse($window.atob(token.split('.')[1])); // We want to parse the payload

      return payload.exp > Date.now() / 1000;
    } else {
      return false;
    }
  };

  auth.currentUser = function(){
    if(auth.isLoggedIn()){
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.username;
    }
  };

  auth.register = function(user){ // Take user object in form
    return $http.post('/register', user).success(function(data){ // Return post request with $http
      auth.saveToken(data.token); // On sucess, save the token
    });
  };

  auth.logIn = function(user){ // Take user object
    return $http.post('/login', user).success(function(data){ // Pass in with login
      auth.saveToken(data.token); // Save if successful
    });
  };

  auth.logOut = function(){
    $window.localStorage.removeItem('gracious-guest-token');
  };

  return auth;

}]);

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

// Controllers

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
