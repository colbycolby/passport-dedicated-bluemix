/**
 * Module dependencies.
 */
const util = require('util');
const OAuth2Strategy = require('passport-oauth2');

/**
 * `BluemixDedicatedStrategy` constructor.
 *
 * The OAuth 2.0 authentication strategy authenticates requests using the OAuth
 * 2.0 protocol.
 *
 * OAuth 2.0 provides a facility for delegated authentication, whereby users can
 * authenticate using a third-party service such as Bluemix login.  Delegating in
 * this manner involves a sequence of events, including redirecting the user to
 * the third-party service for authorization.  Once authorization has been
 * granted, the user is redirected back to the application and an authorization
 * code can be used to obtain credentials.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `userInfoURL`       URL used to obtain user's profile
 *   - `authorizationURL`  URL used to obtain an authorization grant
 *   - `tokenURL`          URL used to obtain an access token
 *   - `clientID`          identifies client to service provider
 *   - `clientSecret`      secret used to establish ownership of the client identifer
 *   - `callbackURL`       URL to which the service provider will redirect the user after obtaining authorization
 *
 * Examples:
 *
 *     passport.use(new BluemixDedicatedStrategy({
 *         authorizationURL: 'https://uaa.example.com/oauth2/authorize',
 *         tokenURL: 'https://uaa.example.com/oauth2/token',
 *         userInfoURL: 'https://uaa.host.bluemix.net/userinfo'
 *         clientID: '123-456-789',
 *         clientSecret: 'keyboard-cat'
 *         callbackURL: 'https://www.example.net/auth/example/callback'
 *       },
 *       function(accessToken, refreshToken, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 */

function Strategy(options={}, verify) {
  
  if (!options.userInfoURL) { throw new TypeError('Strategy requires a user info url.'); }

    //Send clientID, clientSecret in 'Authorization' header
    //They have to be registered with bluemix's UAA server
    options.customHeaders = {
      'Authorization': 'Basic ' + new Buffer(options.clientID + ':' + options.clientSecret).toString('base64')
    };

    OAuth2Strategy.call(this, options, verify);

    this.name = 'bluemix-dedicated';

    //Set AuthMethod as 'Bearer' (used w/ accessToken to perform actual resource actions)
    this._oauth2.setAuthMethod('Bearer');
    
    this._oauth2.useAuthorizationHeaderforGET(true);

    //Used for the userProfile function
    //This is a UAA endpoint .../userinfo of the dedicated instance
    this._userProfileURL = options.userInfoURL;
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);

/**
 * Retrieve UAA user profile.
 *
 * @param {String} accessToken
 * @param {Function} done
 */
Strategy.prototype.userProfile = function (accessToken, done) {
  this._oauth2.get(this._userProfileURL, accessToken, (err, body, res) => {
    if (err)
      return done(err);
    try {
      done(null, JSON.parse(body));
    } catch (e) {
      done(e);
    }
  });
};

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;