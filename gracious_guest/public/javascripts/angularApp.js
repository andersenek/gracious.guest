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
      .state('events/{id}/edit', {
        url: '/events/{id}/edit',
        templateUrl: '/editEvent.html',
        controller: 'EditEventCtrl',
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
app.factory('auth', ['$http', '$window', '$state', function($http, $window, $state){

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
    });
  };

  auth.logOut = function(){
    if($window.localStorage.removeItem('gracious-guest-token')){
      $state.go('home'); // Redirect to home if logged out
    };
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

  o.updateEvent = function(event){
    return $http.put('/events/' + event._id, {event}).success(function(event){ // Post to server
      console.log("this is working") // Remove data from our event array
    }).error(function(event){
      console.log("this isn't working")
    });
  }

  o.deleteEvent = function(event) {
    var index = o.events.indexOf(event);

    return $http.delete('/events/' + event._id).success(function(event){ // Delete from server
      o.events.splice(index, 1); // Remove data from our event array
    }).error(function(event){
      console.log("this isn't working")
    });
  }

  o.addComment = function(id, comment) {
    console.log(comment)
    return $http.post('/events/' + id + '/comments', comment, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    });
  };

  o.deleteCommentFunc = function(event, comment) {
    var index = event.comments.indexOf(comment);
    console.log(index)
    console.log(event.comments)

    return $http.delete('/events/' + event._id + '/comments/' + comment._id).success(function(comment){ // Delete from server
      console.log(comment)
      event.comments.splice(index, 1); // Remove data from our event array
    }).error(function(event){
      console.log("this isn't quite working")
    });
  };

  o.addUser = function(id, username) {
    console.log(username)
    return $http.post('/events/' + id + '/users', username, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).error(function(username){
      console.log(username)
      console.log("this isn't quite working")
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
    $scope.currentUser = auth.currentUser;

    $scope.addEvent = function(){ // Allow user to add a event
      if(!$scope.title || $scope.title === '') {  // Prevent the user from entering a blank title
        return;
      }
      events.createEvent({
        title: $scope.title,
        location: $scope.location,
        date: $scope.date,
        author: 'user',
      });

      $scope.title = ''; // Set area to empty when done
      $scope.location = ''; // Set area to empty when done
      $scope.date = ''; // Set area to empty when done
    };

    $scope.deleteEvent = function(event) {
      events.deleteEvent(event)
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

    $scope.deleteEvent = function(event) {
      if(events.deleteEvent(event)) {
        $state.go('home'); // Redirect to home if deleted
      }
    };

    $scope.deleteComment = function(event, comment) {
      events.deleteCommentFunc(event, comment);
    };

    $scope.addUser = function(){
      if($scope.username === '') { // Prevent the user from entering a blank body
        return;
      }
      events.addUser(event._id, {
        username: $scope.username,
      }).success(function(username) {
        $scope.event.users.push(username); // Comment will post to an event
      });
      $scope.username = ''; // Set area to empty when done
      console.log("event from function is: ", event)
    };

}]); // End EventsCtrl controller

app.controller('EditEventCtrl', [
  '$scope',
  '$state',
  '$location',
  'events',
  'event',
  'auth',

  function($scope, $state, $location, events, event, auth){

    $scope.event = event;
    $scope.isLoggedIn = auth.isLoggedIn;


    $scope.update = function(){
      console.log("An event is:", event)
      if(events.updateEvent(event)) {
        $location.path("/events/" + event._id);
        //$state.go('events'); // Redirect to home if deleted
      }
    };

}]); // End EventsCtrl controller

app.controller('NavCtrl', [
  '$scope',
  '$state',
  'auth',

  function($scope, $state, auth){
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.currentUser = auth.currentUser;
    $scope.logOut = auth.logOut;
    $scope.state = $state;
}]); // End NavCtrl

app.controller('HideCtrl', [
  '$scope',
  '$state',
  'auth',

  function($scope, $state, auth){
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.currentUser = auth.currentUser;
    $scope.logOut = auth.logOut;
    $scope.state = $state;
}]); // End HideCtrl
