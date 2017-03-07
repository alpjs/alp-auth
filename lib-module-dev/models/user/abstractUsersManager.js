import { UserType as _UserType } from './types';

import t from 'flow-runtime';
var UserType = t.tdz(function () {
  return _UserType;
});
export default {
  STATUSES: {
    VALIDATED: 'validated',
    DELETED: 'deleted'
  },

  findOneByAccountOrEmails: function findOneByAccountOrEmails(_ref) {
    var provider = _ref.provider,
        accountId = _ref.accountId,
        emails = _ref.emails;
    t.return(t.ref('Promise', t.nullable(t.ref(UserType))));
    t.param('arguments[0]', t.object(t.property('provider', t.string()), t.property('accountId', t.union(t.string(), t.number())), t.property('emails', t.nullable(t.array(t.string()))))).assert(arguments[0]);

    throw new Error('Not implemented');
  },
  findConnected: function findConnected(connected) {
    var _returnType2 = t.return(t.ref('Promise', t.nullable(t.ref(UserType))));

    return _returnType2.assert(this.store.findByKey(connected));
  },
  insertOne: function insertOne(user) {
    var _returnType3 = t.return(t.ref('Promise', t.any()));

    return _returnType3.assert(this.store.insertOne(user));
  },
  updateOne: function updateOne(user) {
    var _returnType4 = t.return(t.ref('Promise', t.any()));

    return _returnType4.assert(this.store.updateOne(user));
  },
  transformForBrowser: function transformForBrowser(user) {
    return {
      id: user.id,
      displayName: user.displayName,
      fullName: user.fullName,
      status: user.status,
      emails: user.emails,
      emailDomains: user.emailDomains,
      accounts: user.accounts.map(function (account) {
        return {
          provider: account.provider,
          accountId: account.accountId,
          name: account.name,
          status: account.status,
          profile: account.profile
        };
      })
    };
  }
};
//# sourceMappingURL=abstractUsersManager.js.map