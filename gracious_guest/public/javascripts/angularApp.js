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
      })
      .state('login', {
        url: '/login',
        templateUrl: '/login.html',
        controller: 'AuthCtrl',
        onEnter: ['$state', 'auth', function($state, auth){ // Check auth factory
          if(auth.isLoggedIn()){
            $state.go('home');
          }
        }]
      })
      .state('register', {
        url: '/register',
        templateUrl: '/register.html',
        controller: 'AuthCtrl',
        onEnter: ['$state', 'auth', function($state, auth){
          if(auth.isLoggedIn()){
            $state.go('home');
          }
        }]
      });

    $urlRouterProvider.otherwise('home'); // Redirect to home

}]); // End app.config

// Factories
app.factory('auth', ['$http', '$window', function($http, $window){

  var auth = {};

  auth.saveToken = function(token){
    $window.localStorage['gracious-guest-token'] = token; // Access window because this is where localStorage key will be // * Don't change or else everyone will be logged out
  };

  auth.getToken = function(){
    return $window.localStorage['gracious-guest-token'];
  };

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
      console.log(data.token)
    });
  };

  auth.logOut = function(){
    $window.localStorage.removeItem('gracious-guest-token');
  };

  return auth;

}]);

app.factory('events', ['$http', 'auth', function($http, auth){ // Inject http and pass in function

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

  o.createEvent = function(newEvent) {
    return $http.post('/events', newEvent, {
      headers: {Authorization: 'Bearer '+auth.getToken()} // Pass in header with token
    }).success(function(data){ // Post to server
      o.events.push(data); // Add data to our event array
    }).error(function(data){
      console.log("this isn't working")
    });
  };

  o.addComment = function(id, comment) {
    return $http.post('/events/' + id + '/comments', comment, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    });
  };

  return o;
  // End Service Body
}]);

// Controllers

app.controller('AuthCtrl', [
  '$scope',
  '$state',
  'auth',

  function($scope, $state, auth){
    $scope.user = {};

    $scope.register = function(){
      auth.register($scope.user).error(function(error){
        $scope.error = error;
      }).then(function(){
        $state.go('home');
      });
    };

    $scope.logIn = function(){
      auth.logIn($scope.user).error(function(error){
        $scope.error = error;
      }).then(function(){
        $state.go('home');
      });
    };
}]);

// Create a new controller for index.html
app.controller('MainCtrl', [
  '$scope',
  'events',
  'auth',

  function($scope, events, auth){

    $scope.events = events.events; // Bind the $scope.events variable in our controller to the events array in our service
    $scope.isLoggedIn = auth.isLoggedIn;

    $scope.addEvent = function(){ // Allow user to add a event
      if(!$scope.title || $scope.title === '') {  // Prevent the user from entering a blank title
        return;
      }
      events.createEvent({
        title: $scope.title,
        link: $scope.link,
        author: 'user',
      });

      $scope.title = ''; // Set area to empty when done
      $scope.link = ''; // Set area to empty when done
    };

    $scope.deleteEvent = function(event) {
      console.log(event)
      console.log(event._id)
      var index = $scope.events.indexOf(event);
      console.log(index)
      $scope.events.splice(index, 1);
    }


}]); // End MainCtrl controller

app.controller('EventsCtrl', [
  '$scope',
  '$state', // Need access events so we can retreive the ID
  'events', // To access an event from state
  'event',
  'auth',

  function($scope, $state, events, event, auth){

    $scope.event = event;
    $scope.isLoggedIn = auth.isLoggedIn;

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

app.controller('NavCtrl', [
  '$scope',
  'auth',

  function($scope, auth){
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.currentUser = auth.currentUser;
    $scope.logOut = auth.logOut;
}]); // End NavCtrl
