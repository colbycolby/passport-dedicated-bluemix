'use strict';
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');
const BluemixDedicatedStrategy = require('./passport-bluemix');
const session = require('express-session');
const sessionStore = new session.MemoryStore();

const app = express();

// transform request.body to json
app.use(bodyParser.json());
app.use(express.static('public'));

// middleware
app.use(cookieParser());

app.use(session({
  store: sessionStore,
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  console.log('serialize ', user);
  done(null, user);
});

passport.deserializeUser(function(id, done) {
  console.log('deserialize ', id);
  done(null, id);
  // Ideally you might want to do something like this
  // User.findById(id, function(err, user) {
  //   done(err, user);
  // });
});

passport.use(new BluemixDedicatedStrategy({
    userInfoURL: 'https://uaa.<your bluemix domain>/userinfo',
    authorizationURL: 'https://login.<your bluemix domain>/UAALoginServerWAR/oauth/authorize',
    tokenURL: 'https://uaa.<your bluemix domain>/oauth/token',
    clientID: 'CLIENT_ID', // Register with CF UAA
    clientSecret: 'CLIENT_SECRET', // Register with CF UAA
    callbackURL: "http://localhost:3000/auth/bluemix/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    
    /*
    * This verify callback is responsible for finding or creating the user, and
    * invoking `done` with the following arguments:
    *
    *     done(err, user, info);
    *
    * `user` should be set to `false` to indicate an authentication failure.
    * Additional `info` can optionally be passed as a third argument, typically
    * used to display informational messages.  If an exception occured, `err`
    * should be set.
    */
    if(!profile || !profile.user_id)
      return done(null, false);
    else
      return done(null, profile, accessToken);
  }
));

// Redirect the user to Bluemix for authentication. When complete,
// Bluemix will redirect the user back to the application at
// ../auth/bluemix/callback or whatever you specify in the Strategy callbackURL.
// the object with state and scope is optional 
app.get('/auth/bluemix', passport.authenticate('bluemix-dedicated'));

// Bluemix will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/bluemix/callback', passport.authenticate('bluemix-dedicated', { successRedirect: '/home', failureRedirect: '/login' }));

//If user is logged in, passport.js will create user object in req for every
//request in express.js, which you can check for existence in any middleware.
const requireLogin = (req, res, next) =>
  (req.user) ? next() : res.send(401, {message:'Unauthorized'})

app.get('/home', [requireLogin], (req, res) =>
  sessionStore.all((err, sessions) =>
    res.send(`
      <h1>You are authenticated! </h1>
      <p>Look at your session cookie in browser and your session store too.</p>
      <h3>req.session:</h3>
      <pre>${JSON.stringify(req.session, null, 2)}</pre>
      <h3>req.user:</h3>
      <pre>${JSON.stringify(req.user, null, 2)}</pre>
      <h3>Sever-side sessions:</h3>
      <pre>${JSON.stringify(sessions, null, 2)}</pre>
    `)
  )
);

app.get('/logout', (req, res) => req.session.destroy((err) => res.redirect('/')));

app.listen(process.env.PORT || 3000, (err) => {
  if (err) console.log(JSON.stringify(err));
  console.log('==> 🌝 Server started.');
});

