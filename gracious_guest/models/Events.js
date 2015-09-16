// Setup our Event model to persist user's events in the DB
var mongoose = require('mongoose'); // To access mongoose in this file we need to require it

var EventSchema = new mongoose.Schema({
  title: String,
  location: String,
  date: String,
  author: String,
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }] // Reference comments attached to this post id, uses 'Comment' model to make this work
});

mongoose.model('Event', EventSchema);
