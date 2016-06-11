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

    app.registerBrowserStateTransformers((initialBrowserState, ctx) => {
        if (ctx.state.connected) {
            initialBrowserState.connected = ctx.state.connected;
            initialBrowserState.user = usersManager.transformForBrowser(ctx.state.user);
        }
    });
}

function middleware(usersManager) {
    return (() => {
        var ref = _asyncToGenerator(function* (ctx, next) {
            let token = ctx.cookies.get(COOKIE_NAME);
            logger.debug('middleware', { token });
            if (!token) return yield next();

            let connected;
            try {
                let decoded = yield (0, _jsonwebtoken.verify)(token, ctx.config.get('authentication').get('secretKey'), {
                    algorithm: 'HS512',
                    audience: ctx.request.headers['user-agent']
                });
                connected = decoded.connected;
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

        return function (_x3, _x4) {
            return ref.apply(this, arguments);
        };
    })();
}
//# sourceMappingURL=index.js.map