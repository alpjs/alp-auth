'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.UserAccountsService = exports.AuthenticationService = exports.UsersManager = exports.createAuthController = undefined;

var _authController = require('./controllers/authController');

Object.defineProperty(exports, 'createAuthController', {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_authController).default;
    }
});

var _AuthenticationService = require('./services/AuthenticationService');

Object.defineProperty(exports, 'AuthenticationService', {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_AuthenticationService).default;
    }
});

var _UserAccountsService = require('./services/user/UserAccountsService');

Object.defineProperty(exports, 'UserAccountsService', {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_UserAccountsService).default;
    }
});
exports.init = init;
exports.middleware = middleware;

var _jsonwebtoken = require('jsonwebtoken');

var _promiseCallbackFactory = require('promise-callback-factory');

var _promiseCallbackFactory2 = _interopRequireDefault(_promiseCallbackFactory);

var _nightingaleLogger = require('nightingale-logger');

var _nightingaleLogger2 = _interopRequireDefault(_nightingaleLogger);

var _UsersManager = require('./models/user/UsersManager');

var _UsersManager2 = _interopRequireDefault(_UsersManager);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

exports.UsersManager = _UsersManager2.default;


const COOKIE_NAME = 'connectedUser';
const logger = new _nightingaleLogger2.default('alp-auth');

function init(app, usersManager) {
    if (!(usersManager instanceof _UsersManager2.default)) {
        throw new TypeError('Value of argument "usersManager" violates contract.\n\nExpected:\nUsersManager\n\nGot:\n' + _inspect(usersManager));
    }

    app.context.setConnected = (() => {
        var ref = _asyncToGenerator(function* (connected, user) {
            var _this = this;

            if (!(typeof connected === 'number' || typeof connected === 'string')) {
                throw new TypeError('Value of argument "connected" violates contract.\n\nExpected:\nnumber | string\n\nGot:\n' + _inspect(connected));
            }

            if (!(user instanceof Object)) {
                throw new TypeError('Value of argument "user" violates contract.\n\nExpected:\nObject\n\nGot:\n' + _inspect(user));
            }

            logger.debug('setConnected', { connected: connected });
            if (!connected) {
                throw new Error('Illegal value for setConnected');
            }

            this.state.connected = connected;
            this.state.user = user;

            const token = yield (0, _promiseCallbackFactory2.default)(function (done) {
                return (0, _jsonwebtoken.sign)({ connected: connected, time: Date.now() }, _this.config.get('authentication').get('secretKey'), {
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

    app.registerBrowserStateTransformers((initialBrowserState, ctx) => {
        if (ctx.state.connected) {
            initialBrowserState.connected = ctx.state.connected;
            initialBrowserState.user = usersManager.transformForBrowser(ctx.state.user);
        }
    });
}

function middleware(usersManager) {
    if (!(usersManager instanceof _UsersManager2.default)) {
        throw new TypeError('Value of argument "usersManager" violates contract.\n\nExpected:\nUsersManager\n\nGot:\n' + _inspect(usersManager));
    }

    return (() => {
        var ref = _asyncToGenerator(function* (ctx, next) {
            let token = ctx.cookies.get(COOKIE_NAME);
            logger.debug('middleware', { token: token });
            if (!token) return yield next();

            let connected;
            try {
                let decoded = yield (0, _jsonwebtoken.verify)(token, ctx.config.get('authentication').get('secretKey'), {
                    algorithm: 'HS512',
                    audience: ctx.request.headers['user-agent']
                });
                connected = decoded.connected;
            } catch (err) {
                logger.info('failed to verify authentification', { err: err });
                ctx.cookies.set(COOKIE_NAME, '', { expires: new Date(1) });
                return yield next();
            }
            logger.debug('middleware', { connected: connected });

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

        return function (_x3, _x4) {
            return ref.apply(this, arguments);
        };
    })();
}

function _inspect(input, depth) {
    const maxDepth = 4;
    const maxKeys = 15;

    if (depth === undefined) {
        depth = 0;
    }

    depth += 1;

    if (input === null) {
        return 'null';
    } else if (input === undefined) {
        return 'void';
    } else if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
        return typeof input;
    } else if (Array.isArray(input)) {
        if (input.length > 0) {
            if (depth > maxDepth) return '[...]';

            const first = _inspect(input[0], depth);

            if (input.every(item => _inspect(item, depth) === first)) {
                return first.trim() + '[]';
            } else {
                return '[' + input.slice(0, maxKeys).map(item => _inspect(item, depth)).join(', ') + (input.length >= maxKeys ? ', ...' : '') + ']';
            }
        } else {
            return 'Array';
        }
    } else {
        const keys = Object.keys(input);

        if (!keys.length) {
            if (input.constructor && input.constructor.name && input.constructor.name !== 'Object') {
                return input.constructor.name;
            } else {
                return 'Object';
            }
        }

        if (depth > maxDepth) return '{...}';
        const indent = '  '.repeat(depth - 1);
        let entries = keys.slice(0, maxKeys).map(key => {
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
//# sourceMappingURL=index.js.map