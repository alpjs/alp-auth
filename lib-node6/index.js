'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.routes = exports.rethinkUsersManager = exports.mongoUsersManager = exports.abstractUsersManager = undefined;

var _routes = require('./routes');

Object.defineProperty(exports, 'routes', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_routes).default;
  }
});
exports.default = init;

var _jsonwebtoken = require('jsonwebtoken');

var _promiseCallbackFactory = require('promise-callback-factory');

var _promiseCallbackFactory2 = _interopRequireDefault(_promiseCallbackFactory);

var _nightingaleLogger = require('nightingale-logger');

var _nightingaleLogger2 = _interopRequireDefault(_nightingaleLogger);

var _abstractUsersManager = require('./models/user/abstractUsersManager');

var _abstractUsersManager2 = _interopRequireDefault(_abstractUsersManager);

var _mongoUsersManager = require('./models/user/mongoUsersManager');

var _mongoUsersManager2 = _interopRequireDefault(_mongoUsersManager);

var _rethinkUsersManager = require('./models/user/rethinkUsersManager');

var _rethinkUsersManager2 = _interopRequireDefault(_rethinkUsersManager);

var _AuthenticationService = require('./services/AuthenticationService');

var _AuthenticationService2 = _interopRequireDefault(_AuthenticationService);

var _UserAccountsService = require('./services/user/UserAccountsService');

var _UserAccountsService2 = _interopRequireDefault(_UserAccountsService);

var _createAuthController = require('./controllers/createAuthController.server');

var _createAuthController2 = _interopRequireDefault(_createAuthController);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

exports.abstractUsersManager = _abstractUsersManager2.default;
exports.mongoUsersManager = _mongoUsersManager2.default;
exports.rethinkUsersManager = _rethinkUsersManager2.default;


const COOKIE_NAME = 'connectedUser';
const logger = new _nightingaleLogger2.default('alp-auth');

function init(_ref) {
  let controllers = _ref.controllers;
  let usersManager = _ref.usersManager;
  let strategies = _ref.strategies;
  let loginModuleDescriptor = _ref.loginModuleDescriptor;
  let homeRouterKey = _ref.homeRouterKey;

  return app => {
    const userAccountsService = new _UserAccountsService2.default(usersManager);

    const authenticationService = new _AuthenticationService2.default(app.config, strategies, userAccountsService);

    controllers.set('auth', (0, _createAuthController2.default)({
      usersManager,
      authenticationService,
      loginModuleDescriptor,
      homeRouterKey
    }));

    app.context.setConnected = (() => {
      var ref = _asyncToGenerator(function* (connected, user) {
        var _this = this;

        logger.debug('setConnected', { connected });
        if (!connected) {
          throw new Error('Illegal value for setConnected');
        }

        this.state.connected = connected;
        this.state.user = user;

        const token = yield (0, _promiseCallbackFactory2.default)(function (done) {
          return (0, _jsonwebtoken.sign)({ connected, time: Date.now() }, _this.config.get('authentication').get('secretKey'), {
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

    const decodeJwt = (token, userAgent) => {
      const result = (0, _jsonwebtoken.verify)(token, app.config.get('authentication').get('secretKey'), {
        algorithm: 'HS512',
        audience: userAgent
      });
      return result && result.connected;
    };

    if (app.websocket) {
      logger.debug('app has websocket');
      // eslint-disable-next-line
      const Cookies = require('cookies');

      app.websocket.use((() => {
        var ref = _asyncToGenerator(function* (socket, next) {
          const handshakeData = socket.request;
          const cookies = new Cookies(handshakeData, null, { keys: app.keys });
          let token = cookies.get(COOKIE_NAME);
          logger.debug('middleware websocket', { token });

          if (!token) return yield next();

          let connected;
          try {
            connected = yield decodeJwt(token, handshakeData.headers['user-agent']);
          } catch (err) {
            logger.info('failed to verify authentification', { err });
            return yield next();
          }
          logger.debug('middleware websocket', { connected });

          if (!connected) return yield next();

          const user = yield usersManager.findConnected(connected);

          if (!user) return yield next();

          socket.user = user;

          yield next();
        });

        return function (_x3, _x4) {
          return ref.apply(this, arguments);
        };
      })());
    }

    return (() => {
      var ref = _asyncToGenerator(function* (ctx, next) {
        let token = ctx.cookies.get(COOKIE_NAME);
        logger.debug('middleware', { token });

        if (!token) return yield next();

        let connected;
        try {
          connected = yield decodeJwt(token, ctx.request.headers['user-agent']);
        } catch (err) {
          logger.info('failed to verify authentification', { err });
          ctx.cookies.set(COOKIE_NAME, '', { expires: new Date(1) });
          return yield next();
        }
        logger.debug('middleware', { connected });

        if (!connected) return yield next();

        const user = yield usersManager.findConnected(connected);

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
//# sourceMappingURL=index.js.map