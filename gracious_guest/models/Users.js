// Setup our User model to persist users in the DB
var mongoose = require('mongoose'); // To access mongoose in this file we need to require it
var crypto = require('crypto');
var jwt = require('jsonwebtoken'); // Require JSON web token

var UserSchema = new mongoose.Schema({
  username: {type: String, lowercase: true, unique: true}, // Unique string for a username, lowercase
  hash: String, // Since we don't want to store our passwords in plain text, we'll need a field for storing the hash of the password
  salt: String, // We will generate a random salt to every user's password; extra level of security
  event: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }]
});

UserSchema.methods.setPassword = function(password){ // Random salt string
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

UserSchema.methods.validPassword = function(password) { // Take the user's password
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
  return this.hash === hash; // Lets us know if the password entered equals the password hash
};

UserSchema.methods.generateJWT = function() {
  // Set expiration to 60 days
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign({
    _id: this._id,
    username: this.username,
    exp: parseInt(exp.getTime() / 1000),
  }, 'SECRET'); // Usually use ENV token here rather than hardcode
};

mongoose.model('User', UserSchema);
