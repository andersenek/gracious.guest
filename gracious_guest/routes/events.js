var express = require('express');
var jwt = require('express-jwt'); // Requite JWT
var router = express.Router();
var auth = jwt({secret: 'SECRET', userProperty: 'payload'}); // Should be an ENV variable to match Users.js

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

var mongoose = require('mongoose'); // To access our DB
var passport = require('passport'); // Require Passport
var Event = mongoose.model('Event'); // Event Model
var Comment = mongoose.model('Comment'); // Comment Model
var User = mongoose.model('User'); // User Model

// User Route
router.post('/register', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  var user = new User();
  user.username = req.body.username;
  user.setPassword(req.body.password)

  user.save(function (err){
    if(err){ return next(err); }
    return res.json({token: user.generateJWT()}) // JWT generates when user is registered
  });
});

// User Login Route
router.post('/login', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

// Get route for all events
router.get('/events', function(req, res, next) {
  Event.find(function(err, events){
    if(err){ return next(err); }

    res.json(events);
  });
});

// Post route for events
router.post('/events', auth, function(req, res, next) {
  var event = new Event(req.body);
  event.author = req.payload.username;

  event.save(function(err, event){ // Event that is saved
    if(err){ return next(err); } // Or return error

    res.json(event);
  });
});

// Validate event
router.param('event', function(req, res, next, id) {
  var query = Event.findById(id); // Query DB to find post by id

  query.exec(function (err, event){ // Return event
    if (err) { return next(err); }
    if (!event) { return next(new Error('can\'t find event')); }

    req.event = event; // If event is there, set the event
    return next();
  });
});

// Validate comment
router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function (err, comment){
    if (err) { return next(err); }
    if (!comment) { return next(new Error('can\'t find comment')); }

    req.comment = comment;
    return next();
  });
});

// Validate user(guest)
router.param('user', function(req, res, next, id) {
  var query = User.findById(id);

  query.exec(function (err, username){
    if (err) { return next(err); }
    if (!username) { return next(new Error('can\'t find user')); }

    req.username = username;
    return next();
  });
});

// Delete an event
router.delete('/events/:event', function (req, res){
  Event.findById(req.params.event, function (err, e) {
    console.log(e);
    e.remove(function (err) {
      if (!err) {
        console.log("removed");
        res.send("fail");
      } else {
        console.log(err);
        res.send("success")
      }
    });
  });
});

// Show an event and comments
router.get('/events/:event', function(req, res) {
  Event
  .findById(req.params.event)
  .populate('comments')
  .populate('users')
  .exec(function(err, data){
      res.json(data)
  });
});

// Update an event

router.put('/events/:event_id', function(req, res) {

  Event.update({ _id: req.params.event_id} , { $set: req.body.event }, { multi: false }, function(err, updatedTitle) {
    if (err) {
      return res.send(err)
    } else {
      res.send(updatedTitle);
    }
  });
});

// Post Comment
router.post('/events/:event/comments', auth, function(req, res, next) {
  var comment = new Comment(req.body);
  comment.event = req.event;
  comment.author = req.payload.username;

  comment.save(function(err, comment){
    if(err){ return next(err); }

    req.event.comments.push(comment); // Add comment to event
    req.event.save(function(err, event) { // Save comment to DB
      if(err){ return next(err); } // Catch any errors

    res.json(comment);
    });
  });
});

// Delete Comment
router.delete('/events/:event/comments/:comment', function(req, res) {
  Comment.findById(req.params.comment, function (err, comment) {
    event = req.event;
    var index = event.comments.indexOf(comment._id);
    console.log(event)
    console.log("comment index", event.comments.indexOf(comment._id))
    comment.remove(function (err) {
      if (!err) {
        console.log("removed");
        res.send(comment);
      } else {
        console.log(err);
        res.send("hello")
      }
    });
  });
});

// Post User
router.post('/events/:event/users', auth, function(req, res, next) {
  var user = new User(req.body);
  console.log(req.event)
  console.log("********************")
  console.log(req.body)
  console.log(req.body.username)
  console.log("*********USER BELOW***********")
  console.log(user.username)
  var sendUser = user.username

  user.save(function(err, user){
    if(err){
      console.log("an error")
      res.send(err);
    }
    console.log("user is", user)

    req.event.users.push(user); // Add user to event

    req.event.save(function(err, event) { // Save user to DB
      if(err){
        console.log("another error")
        res.send(err);
      } // Catch any errors

    res.json(user);
    });
  });
});

module.exports = router;
