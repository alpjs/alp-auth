import createAuthController from './controllers/createAuthController.browser';

export { default as routes } from './routes';

export default function init(_ref) {
  var controllers = _ref.controllers;
  var loginModuleDescriptor = _ref.loginModuleDescriptor;
  var homeRouterKey = _ref.homeRouterKey;

  return function (app) {
    controllers.set('auth', createAuthController({
      loginModuleDescriptor: loginModuleDescriptor,
      homeRouterKey: homeRouterKey
    }));
  };
}
//# sourceMappingURL=browser.js.map