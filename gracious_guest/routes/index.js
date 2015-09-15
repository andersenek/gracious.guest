var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

var mongoose = require('mongoose'); // To access our DB
var Event = mongoose.model('Event'); // Event Model
var Comment = mongoose.model('Comment'); // Comment Model

router.get('/events', function(req, res, next) { // Get route for all events
  Event.find(function(err, events){
    if(err){ return next(err); }

    res.json(events);
  });
});

router.post('/events', function(req, res, next) { // Post route for events
  var event = new Event(req.body);

  event.save(function(err, event){ // Event that is saved
    if(err){ return next(err); } // Or return error

    res.json(event);
  });
});

router.param('event', function(req, res, next, id) {
  var query = Event.findById(id);

  query.exec(function (err, event){
    if (err) { return next(err); }
    if (!event) { return next(new Error('can\'t find event')); }

    req.event = event;
    return next();
  });
});

// Comment by id
router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function (err, comment){
    if (err) { return next(err); }
    if (!comment) { return next(new Error('can\'t find event')); }

    req.comment = comment;
    return next();
  });
});

router.get('/events/:event', function(req, res) {
  req.event.populate('comments', function(err, event) { // Populate event with comments
    if (err) { return next(err); }

    res.json(event);
  });
});


router.post('/events/:event/comments', function(req, res, next) {
  var comment = new Comment(req.body);
  comment.event = req.event;

  comment.save(function(err, comment){
    if(err){ return next(err); }

    req.event.comments.push(comment); // Add comment to event
    req.event.save(function(err, event) { // Save comment to DB
      if(err){ return next(err); } // Catch any errors

      res.json(comment);
    });
  });
});

module.exports = router;
