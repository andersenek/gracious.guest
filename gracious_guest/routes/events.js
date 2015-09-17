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
  req.event.populate('comments', function(err, event) { // Populate event with comments
    res.json(event);
  });
});

// Update an event

// router.put("/events/:event", function(req, res){
//   console.log("trying to update")
//   Event.findById(req.params.id).then(function(event){
//     if(!event) return error(res, "not found");
//     event.updateAttributes(req.body).then(function(updatedEvent){
//       res.json(updatedEvent);
//     });
//   });
// });

router.put('/events/:event_id', function(req, res) {
    var event = // find event in mongo db using ID     req.event; // Pass in the new event
    event = _.extend(event, req.body);

    event.save(function(err) { // Save the new event
    if (err) {
      return res.send('/event', { // Catch any errors
        errors: err.errors,
        event: event
      });
    } else {
      res.json(event);
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
router.delete('/events/:event/comments/:comment', auth, function(req, res, next) {
  Comment.findById(req.params.comment, function (err, comment) {
    console.log(comment);
    event.comment.remove(function (err) {
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

module.exports = router;
