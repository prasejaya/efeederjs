const passport = require('passport');
const User = require('../models/user');

exports.login = (req, res) => res.render('auth/login');

exports.loginPost = (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/',
    failureFlash: true,
  })(req, res, next);
};

exports.register = (req, res) => res.render('auth/register');

exports.registerPost = async (req, res) => {
  const { name, email, password, password2 } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('auth/register', {
      errors,
      name,
      email,
      password,
      password2,
    });
  } else {
    try {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        errors.push({ msg: 'Email already exists' });
        res.render('auth/register', {
          errors,
          name,
          email,
          password,
          password2,
        });
      } else {
        await User.create(name, email, password);
        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/');
      }
    } catch (err) {
      console.error(err);
    }
  }
};

exports.logout = (req, res) => {
  req.logout(() => {
    req.flash('success_msg', 'You are logged out');
    res.redirect('/');
  });
};