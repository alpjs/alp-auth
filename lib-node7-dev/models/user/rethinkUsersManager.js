'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _abstractUsersManager = require('./abstractUsersManager');

var _abstractUsersManager2 = _interopRequireDefault(_abstractUsersManager);

var _index = require('./types/index');

var _flowRuntime = require('flow-runtime');

var _flowRuntime2 = _interopRequireDefault(_flowRuntime);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const UserType = _flowRuntime2.default.tdz(() => _index.UserType);

const AccountType = _flowRuntime2.default.tdz(() => _index.AccountType);

const mongoUsersManager = Object.create(_abstractUsersManager2.default);
exports.default = mongoUsersManager;


Object.assign(mongoUsersManager, {
  findOneByAccountOrEmails({ provider, accountId, emails }) {
    const _returnType = _flowRuntime2.default.return(_flowRuntime2.default.ref('Promise', _flowRuntime2.default.nullable(_flowRuntime2.default.ref(UserType))));

    _flowRuntime2.default.param('arguments[0]', _flowRuntime2.default.object(_flowRuntime2.default.property('provider', _flowRuntime2.default.string()), _flowRuntime2.default.property('accountId', _flowRuntime2.default.union(_flowRuntime2.default.string(), _flowRuntime2.default.number())), _flowRuntime2.default.property('emails', _flowRuntime2.default.nullable(_flowRuntime2.default.array(_flowRuntime2.default.string()))))).assert(arguments[0]);

    const r = this.store.r;
    let filter = r.row('accounts').contains(row => r.and(row('provider').eq(provider), row('accountId').eq(accountId)));

    if (emails && emails.length) {
      filter = r.or(filter, r.row('emails').contains(row => r.expr(emails).contains(row)));
    }

    let query = this.store.query().filter(filter);
    return _returnType.assert(this.store.findOne(query));
  },

  updateAccount(user, account) {
    let _userType = _flowRuntime2.default.ref(UserType);

    let _accountType = _flowRuntime2.default.ref(AccountType);

    _flowRuntime2.default.param('user', _userType).assert(user);

    _flowRuntime2.default.param('account', _accountType).assert(account);

    let accountIndex = user.accounts.indexOf(account);
    if (accountIndex === -1) {
      throw new Error('Invalid account');
    }

    return this.store.partialUpdateOne(user, {
      accounts: this.store.r.row('accounts').changeAt(accountIndex, account)
    });
  }
});
//# sourceMappingURL=rethinkUsersManager.js.map