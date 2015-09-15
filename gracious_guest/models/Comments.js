// Setup our Comment model to persist user's comments on events in the DB
var mongoose = require('mongoose'); // To access mongoose in this file we need to require it

var CommentSchema = new mongoose.Schema({
  body: String,
  author: String,
  event: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }] // Reference events, uses 'Event' model to make this work
});

mongoose.model('Comment', CommentSchema);
