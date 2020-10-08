
const BodyParser = require('body-parser');
const Filehound = require('filehound');
const Cors = require('cors');
const Helmet = require('helmet');
const Fs = require('fs');
const _ = require('lodash');
const Swagger = require('./swagger');
const Auth = require('./auth');

class ExpressLoader {

  constructor({ appPath, appName }) {
    this.appPath = appPath;
    this.expressPath = `${this.appPath}/express`;
    this.expressApiPath = `${this.expressPath}/api`;
    this.expressRoutePath = `${this.expressPath}/route`;
    this.postFix = 'Route';
    this.Auth = new Auth({ expressPath: this.expressPath });
    this.Swagger = new Swagger({ appPath, appName});
  }

  async loadRoutes({ expressApp, authHandlers }) {
    const apiFilePaths = await Filehound.create()
      .path(this.expressApiPath)
      .ext('.js')
      .glob(`*${this.postFix}.js`)
      .find();

    const routeFilePaths = await Filehound.create()
      .path(this.expressRoutePath)
      .ext('.js')
      .glob(`*${this.postFix}.js`)
      .find();

    const allRouteFilePaths = apiFilePaths.concat(routeFilePaths);
    _.forEach(allRouteFilePaths, (routeFilePath) => {
      let routes = require(routeFilePath) || [];
      if (!_.isArray(routes)) {
        routes = [ routes ]
      }

      _.forEach(routes, (route) => {
        let {
          isActive,
          method,
          path,
          handler,
          options = {},
        } = route;
        
        if (!isActive || !method || !path || !handler) {
          return;
        }

        //method = _.toUpper(method);

        let routeWithMethod = _.get(expressApp, _.toLower(method));
        if (routeWithMethod) {
          routeWithMethod = routeWithMethod.bind(expressApp);

          const preHandlers = [];
          const authName = options.auth;
          let authHandler = authName ? this.Auth.authHandlers[authName] : null;
          if (authHandler) {
            if (!_.isArray(authHandler)) authHandler = [ authHandler ];
            preHandlers.push(...authHandler);
          }

          routeWithMethod(path, preHandlers, handler);
          
        }
      });
    });
  
  }

  apiResponse(req, res, next) {
    res.api = function(data) {
      const response = {
        code(code) {
          return res.status(200).json({
            code,
            data
          })
        }
      }
      return response;
    };
    next();
  }

  async load({ expressApp, appConfigs, log4js, i18nInstance, authHandlers }) {
    if (!Fs.existsSync(this.expressPath)) {
      Fs.mkdirSync(this.expressPath);
    }

    if (!Fs.existsSync(this.expressApiPath)) {
      Fs.mkdirSync(this.expressApiPath);
    }

    if (!Fs.existsSync(this.expressRoutePath)) {
      Fs.mkdirSync(this.expressRoutePath);
    }

    const expressLoaderLogger = log4js.getLogger('system.default');

    //
    await this.Auth.load({});
    await this.Swagger.load({ appConfigs, expressApp, })
    
    //
    expressApp.use(this.apiResponse);
    expressApp.use(Helmet(_.get(appConfigs, 'helmet')));
    expressApp.use(Cors(_.get(appConfigs, 'cors')))
    expressApp.use(BodyParser.urlencoded({ extended: false }));
    expressApp.use(BodyParser.json());
    expressApp.use(i18nInstance.init);

    //
    await this.loadRoutes({ expressApp, authHandlers });

    expressApp.use(function (req, res) {
      return res.status(404).json({ message: 'Not Found'});
    })
    // 500 err
    const expressLoaderErrorLogger = log4js.getLogger('system.error');
    expressApp.use(function (err, req, res, next) {
      expressLoaderErrorLogger.error(err.stack);
      return res.status(500).json({ message: 'Unknow error' });
    });

    //
    const PORT = process.env.PORT;
    await new Promise(res => expressApp.listen(PORT, () => {
      expressLoaderLogger.info(`Server ON!! PORT: ${PORT} - PID: ${process.pid}`);
      res();
    }));
  }
}

module.exports = ExpressLoader;