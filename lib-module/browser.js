import createAuthController from './controllers/createAuthController.browser';

export { default as routes } from './routes';

export default function init(_ref) {
  var controllers = _ref.controllers,
      loginModuleDescriptor = _ref.loginModuleDescriptor,
      homeRouterKey = _ref.homeRouterKey;

  return function () {
    controllers.set('auth', createAuthController({
      loginModuleDescriptor: loginModuleDescriptor,
      homeRouterKey: homeRouterKey
    }));
  };
}
//# sourceMappingURL=browser.js.map