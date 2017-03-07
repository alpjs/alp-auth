var _dec, _dec2, _dec3, _desc, _value, _class, _descriptor, _descriptor2, _descriptor3;

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _initDefineProp(target, property, descriptor, context) {
  if (!descriptor) return;
  Object.defineProperty(target, property, {
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    writable: descriptor.writable,
    value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
  });
}

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['keys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['defineProperty'](target, property, desc);
    desc = null;
  }

  return desc;
}

function _initializerWarningHelper() {
  throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
}

/* eslint camelcase: 'off', max-lines: 'off' */
import EventEmitter from 'events';
import promiseCallback from 'promise-callback-factory';
import Logger from 'nightingale-logger';
import UserAccountsService from './user/UserAccountsService';
import { randomHex } from '../utils/generators';

import t from 'flow-runtime';
const logger = new Logger('alp:auth:authentication');

const GenerateAuthUrlOptionsType = t.type('GenerateAuthUrlOptionsType', t.object(t.property('redirectUri', t.string(), true), t.property('scope', t.string(), true), t.property('state', t.string(), true), t.property('grantType', t.string(), true), t.property('accessType', t.string(), true), t.property('prompt', t.string(), true), t.property('loginHint', t.string(), true), t.property('includeGrantedScopes', t.boolean(), true)));
const GetTokensOptionsType = t.type('GetTokensOptionsType', t.object(t.property('code', t.string()), t.property('redirectUri', t.string())));
let AuthenticationService = (_dec = t.decorate(t.object()), _dec2 = t.decorate(t.object()), _dec3 = t.decorate(function () {
  return t.ref(UserAccountsService);
}), (_class = class extends EventEmitter {

  constructor(config, strategies, userAccountsService) {
    let _strategiesType = t.object();

    let _userAccountsServiceType = t.ref(UserAccountsService);

    t.param('strategies', _strategiesType).assert(strategies);
    t.param('userAccountsService', _userAccountsServiceType).assert(userAccountsService);

    super();

    _initDefineProp(this, 'config', _descriptor, this);

    _initDefineProp(this, 'strategies', _descriptor2, this);

    _initDefineProp(this, 'userAccountsService', _descriptor3, this);

    this.config = config;
    this.strategies = strategies;
    this.userAccountsService = userAccountsService;
  }

  /**
   * @param {string} strategy
   * @param {Object} options
   * @param {string} [options.redirectUri]
   * @param {string} [options.scope]
   * Space-delimited set of permissions that the application requests.
   * @param {string} [options.state]
   * Any string that might be useful to your application upon receipt of the response
   * @param {string} [options.grantType]
   * @param {string} [options.accessType = 'online']
   * online or offline
   * @param {string} [options.prompt]
   * Space-delimited, case-sensitive list of prompts to present the user.
   * Values: none, consent, select_account
   * @param {string} [options.loginHint] email address or sub identifier
   * @param {boolean} [options.includeGrantedScopes]
   * If this is provided with the value true, and the authorization request is granted,
   * the authorization will include any previous authorizations granted
   * to this user/application combination for other scopes
   * @returns {string}
   */
  generateAuthUrl(strategy, options = {}) {
    let _strategyType = t.string();

    t.param('strategy', _strategyType).assert(strategy);
    t.param('options', GenerateAuthUrlOptionsType).assert(options);

    logger.debug('generateAuthUrl', { strategy, options });
    const strategyInstance = this.strategies[strategy];
    switch (strategyInstance.type) {
      case 'oauth2':
        return strategyInstance.oauth2.authorizationCode.authorizeURL({
          redirect_uri: options.redirectUri,
          scope: options.scope,
          state: options.state,
          grant_type: options.grantType,
          access_type: options.accessType,
          login_hint: options.loginHint,
          include_granted_scopes: options.includeGrantedScopes
        });
    }
  }

  getTokens(strategy, options = {}) {
    let _strategyType2 = t.string();

    t.param('strategy', _strategyType2).assert(strategy);
    t.param('options', GetTokensOptionsType).assert(options);

    logger.debug('getTokens', { strategy, options });
    const strategyInstance = this.strategies[strategy];
    switch (strategyInstance.type) {
      case 'oauth2':
        return promiseCallback(function (done) {
          strategyInstance.oauth2.authorizationCode.getToken({
            code: options.code,
            redirect_uri: options.redirectUri
          }, done);
        }).then(function (result) {
          return result && {
            accessToken: result.access_token,
            refreshToken: result.refresh_token,
            tokenType: result.token_type,
            expiresIn: result.expires_in,
            expireDate: function () {
              const d = new Date();
              d.setTime(d.getTime() + result.expires_in * 1000);
              return d;
            }(),
            idToken: result.id_token
          }
          // return strategyInstance.accessToken.create(result);
          ;
        });
    }
  }

  refreshToken(strategy, tokens) {
    let _strategyType3 = t.string();

    t.param('strategy', _strategyType3).assert(strategy);

    logger.debug('refreshToken', { strategy });
    if (!tokens.refreshToken) {
      throw new Error('Missing refresh token');
    }
    const strategyInstance = this.strategies[strategy];
    switch (strategyInstance.type) {
      case 'oauth2':
        {
          const token = strategyInstance.oauth2.accessToken.create({
            refresh_token: tokens.refreshToken
          });
          return promiseCallback(function (done) {
            return token.refresh(done);
          }).then(function (result) {
            const tokens = result.token;
            return result && {
              accessToken: tokens.access_token,
              tokenType: tokens.token_type,
              expiresIn: tokens.expires_in,
              expireDate: function () {
                const d = new Date();
                d.setTime(d.getTime() + tokens.expires_in * 1000);
                return d;
              }(),
              idToken: tokens.id_token
            };
          });
        }
    }
  }

  redirectUri(ctx, strategy) {
    let _strategyType4 = t.string();

    t.param('strategy', _strategyType4).assert(strategy);

    const host = `http${this.config.get('allowHttps') ? 's' : ''}://${ctx.request.host}`;
    return `${host}${ctx.urlGenerator('loginResponse', { strategy })}`;
  }

  /**
   *
   * @param {Koa.Context} ctx
   * @param {string} strategy
   * @param {string} [refreshToken]
   * @param {string} [scopeKey='login']
   * @param user
   * @param accountId
   * @returns {*}
   */
  redirectAuthUrl(ctx, strategy, refreshToken, scopeKey, user, accountId) {
    var _this = this;

    return _asyncToGenerator(function* () {
      let _ctxType = t.object();

      let _strategyType5 = t.string();

      let _refreshTokenType = t.nullable(t.string());

      let _scopeKeyType = t.nullable(t.string());

      t.param('ctx', _ctxType).assert(ctx);
      t.param('strategy', _strategyType5).assert(strategy);
      t.param('refreshToken', _refreshTokenType).assert(refreshToken);
      t.param('scopeKey', _scopeKeyType).assert(scopeKey);

      logger.debug('redirectAuthUrl', { strategy, scopeKey, refreshToken });
      const state = yield randomHex(8);

      const scope = _this.userAccountsService.getScope(strategy, scopeKey || 'login', user, accountId);

      ctx.cookies.set(`auth_${strategy}_${state}`, JSON.stringify({
        scopeKey,
        scope,
        isLoginAccess: !scopeKey || scopeKey === 'login'
      }), {
        maxAge: 600000,
        httpOnly: true,
        secure: _this.config.get('allowHttps')
      });
      const redirectUri = _this.generateAuthUrl(strategy, {
        redirectUri: _this.redirectUri(ctx, strategy),
        scope,
        state,
        accessType: refreshToken ? 'offline' : 'online'
      });

      return yield ctx.redirect(redirectUri);
    })();
  }

  /**
   * @param {Koa.Context} ctx
   * @param {string} strategy
   * @param {boolean} isConnected
   * @returns {*}
   */
  accessResponse(ctx, strategy, isConnected) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      let _strategyType6 = t.string();

      let _isConnectedType = t.nullable(t.boolean());

      t.param('strategy', _strategyType6).assert(strategy);
      t.param('isConnected', _isConnectedType).assert(isConnected);

      if (ctx.query.error) {
        const error = new Error(ctx.query.error);
        error.status = 403;
        error.expose = true;
        throw error;
      }

      const code = ctx.query.code;
      const state = ctx.query.state;
      const cookieName = `auth_${strategy}_${state}`;
      let cookie = ctx.cookies.get(cookieName);
      ctx.cookies.set(cookieName, '', { expires: new Date(1) });
      if (!cookie) {
        throw new Error('No cookie for this state');
      }

      cookie = JSON.parse(cookie);
      if (!cookie || !cookie.scope) {
        throw new Error('Unexpected cookie value');
      }

      if (!cookie.isLoginAccess) {
        if (!isConnected) {
          throw new Error('You are not connected');
        }
      }

      const tokens = yield _this2.getTokens(strategy, {
        code,
        redirectUri: _this2.redirectUri(ctx, strategy)
      });

      if (cookie.isLoginAccess) {
        const user = yield _this2.userAccountsService.findOrCreateFromGoogle(strategy, tokens, cookie.scope, cookie.scopeKey);
        return user;
      }

      ctx.cookies.set(cookieName, '', { expires: new Date(1) });
      const connectedUser = ctx.state.connected;
      yield _this2.userAccountsService.update(connectedUser, strategy, tokens, cookie.scope, cookie.scopeKey);
      return connectedUser;
    })();
  }

  refreshAccountTokens(user, account) {
    var _this3 = this;

    if (account.tokenExpireDate && account.tokenExpireDate.getTime() > Date.now()) {
      return Promise.resolve(false);
    }
    return this.refreshToken(account.provider, {
      accessToken: account.accessToken,
      refreshToken: account.refreshToken
    }).then(function (tokens) {
      if (!tokens) {
        // serviceGoogle.updateFields({ accessToken:null, refreshToken:null, status: .OUTDATED });
        return false;
      }
      account.accessToken = tokens.accessToken;
      account.tokenExpireDate = tokens.expireDate;
      return _this3.userAccountsService.updateAccount(user, account).then(function () {
        return true;
      });
    });
  }
}, (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'config', [_dec], {
  enumerable: true,
  initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'strategies', [_dec2], {
  enumerable: true,
  initializer: null
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, 'userAccountsService', [_dec3], {
  enumerable: true,
  initializer: null
})), _class));
export { AuthenticationService as default };
//# sourceMappingURL=AuthenticationService.js.map