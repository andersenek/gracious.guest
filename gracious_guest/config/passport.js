var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy; // Where we have our logic on how to authenticate a user given a username and password
var mongoose = require('mongoose');
var User = mongoose.model('User');

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) { // Note that this function calls the validPassword() function that we just created
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));
