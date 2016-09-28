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
  var _this2 = this;

  var controllers = _ref.controllers;
  var usersManager = _ref.usersManager;
  var strategies = _ref.strategies;
  var loginModuleDescriptor = _ref.loginModuleDescriptor;
  var homeRouterKey = _ref.homeRouterKey;

  _assert({
    controllers: controllers,
    usersManager: usersManager,
    strategies: strategies,
    loginModuleDescriptor: loginModuleDescriptor,
    homeRouterKey: homeRouterKey
  }, _t.interface({
    controllers: Map,
    usersManager: _t.Object,
    strategies: _t.Object,
    loginModuleDescriptor: _t.Object,
    homeRouterKey: _t.maybe(_t.String)
  }), '{ controllers, usersManager, strategies, loginModuleDescriptor, homeRouterKey }');

  return function (app) {
    var userAccountsService = new UserAccountsService(usersManager);

    var authenticationService = new AuthenticationService(app.config, strategies, userAccountsService);

    controllers.set('auth', createAuthController({
      usersManager: usersManager,
      authenticationService: authenticationService,
      loginModuleDescriptor: loginModuleDescriptor,
      homeRouterKey: homeRouterKey
    }));

    app.context.setConnected = function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(connected, user) {
        var _this = this;

        var token;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _assert(connected, _t.union([_t.Number, _t.String]), 'connected');

                _assert(user, _t.Object, 'user');

                logger.debug('setConnected', { connected: connected });

                if (connected) {
                  _context.next = 5;
                  break;
                }

                throw new Error('Illegal value for setConnected');

              case 5:

                this.state.connected = connected;
                this.state.user = user;

                _context.next = 9;
                return promiseCallback(function (done) {
                  return sign({ connected: connected, time: Date.now() }, _this.config.get('authentication').get('secretKey'), {
                    algorithm: 'HS512',
                    audience: _this.request.headers['user-agent'],
                    expiresIn: '30 days'
                  }, done);
                });

              case 9:
                token = _context.sent;


                this.cookies.set(COOKIE_NAME, token, {
                  httpOnly: true,
                  secure: this.config.get('allowHttps')
                });

              case 11:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function (_x, _x2) {
        return ref.apply(this, arguments);
      };
    }();

    app.context.logout = function () {
      delete this.state.connected;
      delete this.state.user;
      this.cookies.set(COOKIE_NAME, '', { expires: new Date(1) });
    };

    app.registerBrowserStateTransformer(function (initialBrowserState, ctx) {
      if (ctx.state.connected) {
        initialBrowserState.connected = ctx.state.connected;
        initialBrowserState.user = usersManager.transformForBrowser(ctx.state.user);
      }
    });

    var decodeJwt = function decodeJwt(token, userAgent) {
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

        app.websocket.use(function () {
          var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(socket, next) {
            var handshakeData, cookies, token, connected, user;
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    handshakeData = socket.request;
                    cookies = new Cookies(handshakeData, null, { keys: app.keys });
                    token = cookies.get(COOKIE_NAME);

                    logger.debug('middleware websocket', { token: token });

                    if (token) {
                      _context2.next = 8;
                      break;
                    }

                    _context2.next = 7;
                    return next();

                  case 7:
                    return _context2.abrupt('return', _context2.sent);

                  case 8:
                    connected = undefined;
                    _context2.prev = 9;
                    _context2.next = 12;
                    return decodeJwt(token, handshakeData.headers['user-agent']);

                  case 12:
                    connected = _context2.sent;
                    _context2.next = 21;
                    break;

                  case 15:
                    _context2.prev = 15;
                    _context2.t0 = _context2['catch'](9);

                    logger.info('failed to verify authentification', { err: _context2.t0 });
                    _context2.next = 20;
                    return next();

                  case 20:
                    return _context2.abrupt('return', _context2.sent);

                  case 21:
                    logger.debug('middleware websocket', { connected: connected });

                    if (connected) {
                      _context2.next = 26;
                      break;
                    }

                    _context2.next = 25;
                    return next();

                  case 25:
                    return _context2.abrupt('return', _context2.sent);

                  case 26:
                    _context2.next = 28;
                    return usersManager.findConnected(connected);

                  case 28:
                    user = _context2.sent;

                    if (user) {
                      _context2.next = 33;
                      break;
                    }

                    _context2.next = 32;
                    return next();

                  case 32:
                    return _context2.abrupt('return', _context2.sent);

                  case 33:

                    socket.user = user;

                    _context2.next = 36;
                    return next();

                  case 36:
                  case 'end':
                    return _context2.stop();
                }
              }
            }, _callee2, _this2, [[9, 15]]);
          }));

          return function (_x3, _x4) {
            return ref.apply(this, arguments);
          };
        }());
      })();
    }

    return function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(ctx, next) {
        var token, connected, user;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                token = ctx.cookies.get(COOKIE_NAME);

                logger.debug('middleware', { token: token });

                if (token) {
                  _context3.next = 6;
                  break;
                }

                _context3.next = 5;
                return next();

              case 5:
                return _context3.abrupt('return', _context3.sent);

              case 6:
                connected = undefined;
                _context3.prev = 7;
                _context3.next = 10;
                return decodeJwt(token, ctx.request.headers['user-agent']);

              case 10:
                connected = _context3.sent;
                _context3.next = 20;
                break;

              case 13:
                _context3.prev = 13;
                _context3.t0 = _context3['catch'](7);

                logger.info('failed to verify authentification', { err: _context3.t0 });
                ctx.cookies.set(COOKIE_NAME, '', { expires: new Date(1) });
                _context3.next = 19;
                return next();

              case 19:
                return _context3.abrupt('return', _context3.sent);

              case 20:
                logger.debug('middleware', { connected: connected });

                if (connected) {
                  _context3.next = 25;
                  break;
                }

                _context3.next = 24;
                return next();

              case 24:
                return _context3.abrupt('return', _context3.sent);

              case 25:
                _context3.next = 27;
                return usersManager.findConnected(connected);

              case 27:
                user = _context3.sent;

                if (user) {
                  _context3.next = 33;
                  break;
                }

                ctx.cookies.set(COOKIE_NAME, '', { expires: new Date(1) });
                _context3.next = 32;
                return next();

              case 32:
                return _context3.abrupt('return', _context3.sent);

              case 33:

                ctx.state.connected = connected;
                ctx.state.user = user;

                _context3.next = 37;
                return next();

              case 37:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, _this2, [[7, 13]]);
      }));

      return function (_x5, _x6) {
        return ref.apply(this, arguments);
      };
    }();
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