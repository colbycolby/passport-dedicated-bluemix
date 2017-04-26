# passport-dedicated-bluemix

This module lets you authenticate against an instance of Dedicated Bluemix (via CloudFoundry's UAA server) in your Node.js applications. By plugging into Passport, the Dedicated Bluemix authentication can integrate into any application or framework that supports [Connect](http://www.senchalabs.org/connect/)-style middleware, including [Express](http://expressjs.com/).

## Installation
```
  $ npm install passport-dedicated-bluemix
```
## Usage


#### Register Application with Bluemix's User Account and Authentication Service

Before using `passport-dedicated-bluemix`, you must register the application with your Dedicated Bluemix User Account and Authentication Service (UAA).  If you have not already done so, client application registration can be found in [here](https://github.com/cloudfoundry/uaa/blob/master/docs/UAA-APIs.rst#register-client-post-oauth-clients). As a side note, you will have to have some elevated permissions in your Bluemix instance to be able to register a client application with it's UAA server. Remember the `client_id` and `client_secret` to use with the passport strategy. In addition, the `redirect_uri` will have to match the route in your application.

#### Configure Strategy

The Dedicated Bluemix authentication strategy authenticates users using a CloudFoundry UAA user account and OAuth 2.0 tokens. The strategy requires a `verify` callback, which accepts these credentials and calls `done` providing a user, as well as `options` specifying a a user info URL, authorization URL, token URL, client ID, client secret, and callback URL.


```js
passport.use(new BluemixDedicatedStrategy({
    userInfoURL: 'https://uaa.<your bluemix domain>/userinfo',
    authorizationURL: 'https://login.<your bluemix domain>/UAALoginServerWAR/oauth/authorize',
    tokenURL: 'https://uaa.<your bluemix domain>/oauth/token',
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/bluemix/callback"
  },
  (accessToken, refreshToken, profile, done) =>
    User.findOrCreate({ userId: profile.id }, (err, user) =>
      done(err, user));
));
```

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'dedicated-bluemix'` strategy, to authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

```js
app.get('/auth/bluemix', passport.authenticate('bluemix-dedicated'));

app.get('/auth/bluemix/callback', passport.authenticate('bluemix-dedicated', { successRedirect: '/home', failureRedirect: '/login' }));
```

## Examples

Developers using the popular [Express](http://expressjs.com/) web framework can
refer to an [example](https://github.com/colbyy/passport-dedicated-bluemix/blob/master/examples/server.js)
as a starting point for their own applications.

## FAQ

##### How do I request additional permissions?

If you need additional permissions from the user, the permissions can be
requested via the `scope` option to `passport.authenticate()`.

```js
app.get('/auth/bluemix', passport.authenticate('bluemix-dedicated', {
  scope: 'cloud_controller.read+openid+cloud_controller_service_permissions.read'
}));
```

##### How can I retain some sort of data throughout the OAuth flow?

CloudFoundry's UAA server utilizes a state parameter that will be passed back to the `/callback` route of your application. If you need to use this, the permissions can be
requested via the `state` option to `passport.authenticate()`. 

```js
app.get('/auth/bluemix', passport.authenticate('bluemix-dedicated', {
  state: 'my-state-string',
}));
```

