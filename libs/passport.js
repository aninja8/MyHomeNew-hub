'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const _pick = require('lodash/pick');
const bcrypt = require('bcrypt');
const Bluebird = require('bluebird');
const UserModel = require('../models/users');

const compare = Bluebird.promisify(bcrypt.compare, {context: bcrypt});

passport.use(new LocalStrategy(
  function(username, password, done) {
    UserModel.findOne({email: username})
      .then(user => {
        if(!user) {
          return done(null, false);
        }

        return compare(password, user.password)
          .then(res => done(null, (res ? _pick(user.toJSON(), ['_id', 'email', 'name']) : false)))
      })
      .catch(done);
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.email);
});

passport.deserializeUser(function(email, done) {
  UserModel.findOne({ email })
    .then(user => done(null, _pick(user.toJSON(), ['_id', 'email', 'name'])))
    .catch(done);
});

module.exports.authMiddleware = (req, res, next) => {
  passport.authenticate('local', function(err, user, info) {
    if(err) {
      return next(err);
    }

    if(!user) {
      return res.status(401).json({});
    }

    req.login(user, err => {
      if(err) {
        return next(err);
      }
      
      next();
    })
  })(req, res, next);
};

module.exports.authorize = (req, res, next) => {
  if(!req.isAuthenticated() || !req.user){
    return res.status(401).json({
      error: 'UNAUTHORIZED'
    });
  }
  next();
};
