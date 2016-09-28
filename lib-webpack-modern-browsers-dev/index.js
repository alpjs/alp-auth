import _t from 'tcomb-forked';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

import { sign, verify } from 'jsonwebtoken';
import promiseCallback from 'promise-callback-factory';
import Logger from 'nightingale-logger';
import abstractUsersManager from './models/user/abstractUsersManager';
import mongoUsersManager from './models/user/mongoUsersManager';
import rethinkUsersManager from './models/user/rethinkUsersManager';
import AuthenticationService from './services/AuthenticationService';
import UserAccountsService from './services/user/UserAccountsService';
import createAuthController from './controllers/createAuthController.server';

export { abstractUsersManager, mongoUsersManager, rethinkUsersManager };
export { default as routes } from './routes';

var COOKIE_NAME = 'connectedUser';
var logger = new Logger('alp-auth');

export default function init(_ref) {
  var controllers = _ref.controllers;
  var usersManager = _ref.usersManager;
  var strategies = _ref.strategies;
  var loginModuleDescriptor = _ref.loginModuleDescriptor;
  var homeRouterKey = _ref.homeRouterKey;

  _assert({
    controllers,
    usersManager,
    strategies,
    loginModuleDescriptor,
    homeRouterKey
  }, _t.interface({
    controllers: Map,
    usersManager: _t.Object,
    strategies: _t.Object,
    loginModuleDescriptor: _t.Object,
    homeRouterKey: _t.maybe(_t.String)
  }), '{ controllers, usersManager, strategies, loginModuleDescriptor, homeRouterKey }');

  return app => {
    var userAccountsService = new UserAccountsService(usersManager);

    var authenticationService = new AuthenticationService(app.config, strategies, userAccountsService);

    controllers.set('auth', createAuthController({
      usersManager,
      authenticationService,
      loginModuleDescriptor,
      homeRouterKey
    }));

    app.context.setConnected = (() => {
      var ref = _asyncToGenerator(function* (connected, user) {
        var _this = this;

        _assert(connected, _t.union([_t.Number, _t.String]), 'connected');

        _assert(user, _t.Object, 'user');

        logger.debug('setConnected', { connected });
        if (!connected) {
          throw new Error('Illegal value for setConnected');
        }

        this.state.connected = connected;
        this.state.user = user;

        var token = yield promiseCallback(function (done) {
          return sign({ connected, time: Date.now() }, _this.config.get('authentication').get('secretKey'), {
            algorithm: 'HS512',
            audience: _this.request.headers['user-agent'],
            expiresIn: '30 days'
          }, done);
        });

        this.cookies.set(COOKIE_NAME, token, {
          httpOnly: true,
          secure: this.config.get('allowHttps')
        });
      });

      return function (_x, _x2) {
        return ref.apply(this, arguments);
      };
    })();

    app.context.logout = function () {
      delete this.state.connected;
      delete this.state.user;
      this.cookies.set(COOKIE_NAME, '', { expires: new Date(1) });
    };

    app.registerBrowserStateTransformer((initialBrowserState, ctx) => {
      if (ctx.state.connected) {
        initialBrowserState.connected = ctx.state.connected;
        initialBrowserState.user = usersManager.transformForBrowser(ctx.state.user);
      }
    });

    var decodeJwt = (token, userAgent) => {
      var result = verify(token, app.config.get('authentication').get('secretKey'), {
        algorithm: 'HS512',
        audience: userAgent
      });
      return result && result.connected;
    };

    if (app.websocket) {
      (function () {
        logger.debug('app has websocket');
        // eslint-disable-next-line
        var Cookies = require('cookies');

        app.websocket.use((() => {
          var ref = _asyncToGenerator(function* (socket, next) {
            var handshakeData = socket.request;
            var cookies = new Cookies(handshakeData, null, { keys: app.keys });
            var token = cookies.get(COOKIE_NAME);
            logger.debug('middleware websocket', { token });

            if (!token) return yield next();

            var connected = undefined;
            try {
              connected = yield decodeJwt(token, handshakeData.headers['user-agent']);
            } catch (err) {
              logger.info('failed to verify authentification', { err });
              return yield next();
            }
            logger.debug('middleware websocket', { connected });

            if (!connected) return yield next();

            var user = yield usersManager.findConnected(connected);

            if (!user) return yield next();

            socket.user = user;

            yield next();
          });

          return function (_x3, _x4) {
            return ref.apply(this, arguments);
          };
        })());
      })();
    }

    return (() => {
      var ref = _asyncToGenerator(function* (ctx, next) {
        var token = ctx.cookies.get(COOKIE_NAME);
        logger.debug('middleware', { token });

        if (!token) return yield next();

        var connected = undefined;
        try {
          connected = yield decodeJwt(token, ctx.request.headers['user-agent']);
        } catch (err) {
          logger.info('failed to verify authentification', { err });
          ctx.cookies.set(COOKIE_NAME, '', { expires: new Date(1) });
          return yield next();
        }
        logger.debug('middleware', { connected });

        if (!connected) return yield next();

        var user = yield usersManager.findConnected(connected);

        if (!user) {
          ctx.cookies.set(COOKIE_NAME, '', { expires: new Date(1) });
          return yield next();
        }

        ctx.state.connected = connected;
        ctx.state.user = user;

        yield next();
      });

      return function (_x5, _x6) {
        return ref.apply(this, arguments);
      };
    })();
  };
}

function _assert(x, type, name) {
  function message() {
    return 'Invalid value ' + _t.stringify(x) + ' supplied to ' + name + ' (expected a ' + _t.getTypeName(type) + ')';
  }

  if (_t.isType(type)) {
    if (!type.is(x)) {
      type(x, [name + ': ' + _t.getTypeName(type)]);

      _t.fail(message());
    }

    return type(x);
  }

  if (!(x instanceof type)) {
    _t.fail(message());
  }

  return x;
}
//# sourceMappingURL=index.js.map