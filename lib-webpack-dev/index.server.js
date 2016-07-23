var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

import { sign, verify } from 'jsonwebtoken';
import promiseCallback from 'promise-callback-factory';
import Logger from 'nightingale-logger';
import UsersManager from './models/user/UsersManager';
import AuthenticationService from './services/AuthenticationService';
import UserAccountsService from './services/user/UserAccountsService';
import createAuthController from './controllers/authController';

export { UsersManager };
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

    if (!(arguments[0] != null && arguments[0].controllers instanceof Map && arguments[0].usersManager instanceof UsersManager && arguments[0].strategies instanceof Object && arguments[0].loginModuleDescriptor instanceof Object && (arguments[0].homeRouterKey == null || typeof arguments[0].homeRouterKey === 'string'))) {
        throw new TypeError('Value of argument 0 violates contract.\n\nExpected:\n{ controllers: Map;\n  usersManager: UsersManager;\n  strategies: Object;\n  loginModuleDescriptor: Object;\n  homeRouterKey: ?string;\n}\n\nGot:\n' + _inspect(arguments[0]));
    }

    return function (app) {
        var userAccountsService = new UserAccountsService(usersManager);

        var authenticationService = new AuthenticationService(app.config, strategies, userAccountsService);

        controllers.set('auth', createAuthController({
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
                                if (typeof connected === 'number' || typeof connected === 'string') {
                                    _context.next = 2;
                                    break;
                                }

                                throw new TypeError('Value of argument "connected" violates contract.\n\nExpected:\nnumber | string\n\nGot:\n' + _inspect(connected));

                            case 2:
                                if (user instanceof Object) {
                                    _context.next = 4;
                                    break;
                                }

                                throw new TypeError('Value of argument "user" violates contract.\n\nExpected:\nObject\n\nGot:\n' + _inspect(user));

                            case 4:
                                logger.debug('setConnected', { connected: connected });

                                if (connected) {
                                    _context.next = 7;
                                    break;
                                }

                                throw new Error('Illegal value for setConnected');

                            case 7:

                                this.state.connected = connected;
                                this.state.user = user;

                                _context.next = 11;
                                return promiseCallback(function (done) {
                                    return sign({ connected: connected, time: Date.now() }, _this.config.get('authentication').get('secretKey'), {
                                        algorithm: 'HS512',
                                        audience: _this.request.headers['user-agent'],
                                        expiresIn: '30 days'
                                    }, done);
                                });

                            case 11:
                                token = _context.sent;


                                this.cookies.set(COOKIE_NAME, token, {
                                    httpOnly: true,
                                    secure: this.config.get('allowHttps')
                                });

                            case 13:
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

        app.registerBrowserStateTransformers(function (initialBrowserState, ctx) {
            if (ctx.state.connected) {
                initialBrowserState.connected = ctx.state.connected;
                initialBrowserState.user = usersManager.transformForBrowser(ctx.state.user);
            }
        });

        return function () {
            var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(ctx, next) {
                var token, connected, decoded, user;
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                token = ctx.cookies.get(COOKIE_NAME);

                                logger.debug('middleware', { token: token });

                                if (token) {
                                    _context2.next = 6;
                                    break;
                                }

                                _context2.next = 5;
                                return next();

                            case 5:
                                return _context2.abrupt('return', _context2.sent);

                            case 6:
                                connected = undefined;
                                _context2.prev = 7;
                                _context2.next = 10;
                                return verify(token, ctx.config.get('authentication').get('secretKey'), {
                                    algorithm: 'HS512',
                                    audience: ctx.request.headers['user-agent']
                                });

                            case 10:
                                decoded = _context2.sent;

                                connected = decoded.connected;
                                _context2.next = 21;
                                break;

                            case 14:
                                _context2.prev = 14;
                                _context2.t0 = _context2['catch'](7);

                                logger.info('failed to verify authentification', { err: _context2.t0 });
                                ctx.cookies.set(COOKIE_NAME, '', { expires: new Date(1) });
                                _context2.next = 20;
                                return next();

                            case 20:
                                return _context2.abrupt('return', _context2.sent);

                            case 21:
                                logger.debug('middleware', { connected: connected });

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
                                    _context2.next = 34;
                                    break;
                                }

                                ctx.cookies.set(COOKIE_NAME, '', { expires: new Date(1) });
                                _context2.next = 33;
                                return next();

                            case 33:
                                return _context2.abrupt('return', _context2.sent);

                            case 34:

                                ctx.state.connected = connected;
                                ctx.state.user = user;

                                _context2.next = 38;
                                return next();

                            case 38:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, _this2, [[7, 14]]);
            }));

            return function (_x3, _x4) {
                return ref.apply(this, arguments);
            };
        }();
    };
}

function _inspect(input, depth) {
    var maxDepth = 4;
    var maxKeys = 15;

    if (depth === undefined) {
        depth = 0;
    }

    depth += 1;

    if (input === null) {
        return 'null';
    } else if (input === undefined) {
        return 'void';
    } else if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
        return typeof input === 'undefined' ? 'undefined' : _typeof(input);
    } else if (Array.isArray(input)) {
        if (input.length > 0) {
            var _ret = function () {
                if (depth > maxDepth) return {
                        v: '[...]'
                    };

                var first = _inspect(input[0], depth);

                if (input.every(function (item) {
                    return _inspect(item, depth) === first;
                })) {
                    return {
                        v: first.trim() + '[]'
                    };
                } else {
                    return {
                        v: '[' + input.slice(0, maxKeys).map(function (item) {
                            return _inspect(item, depth);
                        }).join(', ') + (input.length >= maxKeys ? ', ...' : '') + ']'
                    };
                }
            }();

            if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        } else {
            return 'Array';
        }
    } else {
        var keys = Object.keys(input);

        if (!keys.length) {
            if (input.constructor && input.constructor.name && input.constructor.name !== 'Object') {
                return input.constructor.name;
            } else {
                return 'Object';
            }
        }

        if (depth > maxDepth) return '{...}';
        var indent = '  '.repeat(depth - 1);
        var entries = keys.slice(0, maxKeys).map(function (key) {
            return (/^([A-Z_$][A-Z0-9_$]*)$/i.test(key) ? key : JSON.stringify(key)) + ': ' + _inspect(input[key], depth) + ';';
        }).join('\n  ' + indent);

        if (keys.length >= maxKeys) {
            entries += '\n  ' + indent + '...';
        }

        if (input.constructor && input.constructor.name && input.constructor.name !== 'Object') {
            return input.constructor.name + ' {\n  ' + indent + entries + '\n' + indent + '}';
        } else {
            return '{\n  ' + indent + entries + '\n' + indent + '}';
        }
    }
}
//# sourceMappingURL=index.server.js.map