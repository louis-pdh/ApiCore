
const BodyParser = require('body-parser');
const Filehound = require('filehound');
const Cors = require('cors');
const Helmet = require('helmet');
const Fs = require('fs');
const _ = require('lodash');


class ExpressLoader {

  constructor({ appPath }) {
    this.appPath = appPath;
    this.expressPath = `${this.appPath}/express`;
    this.expressApiPath = `${this.expressPath}/api`;
    this.expressRoutePath = `${this.expressPath}/route`;
    this.postFix = 'Route'
  }

  async loadRoutes(expressApp) {
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
        } = route;
        
        if (!isActive || !method || !path || !handler) {
          return;
        }

        //method = _.toUpper(method);

        let routeWithMethod = _.get(expressApp, _.toLower(method));
        if (routeWithMethod) {
          routeWithMethod = routeWithMethod.bind(expressApp);
          routeWithMethod(path, handler);
        }
      });
    });
  
  }

  async load({ expressApp, appConfigs, log4js, i18nInstance }) {
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
    expressApp.use(Helmet(_.get(appConfigs, 'helmet')));
    expressApp.use(Cors(_.get(appConfigs, 'cors')))
    expressApp.use(BodyParser.urlencoded({ extended: false }));
    expressApp.use(BodyParser.json());
    expressApp.use(i18nInstance.init);
    //


    await this.loadRoutes(expressApp);

    
    // 500 err
    const expressLoaderErrorLogger = log4js.getLogger('system.error');
    expressApp.use(function (err, req, res, next) {
      expressLoaderErrorLogger.error(err.stack);
      return res.status(500).json({ message: 'Unknow error' });
    });

    //
    await new Promise(res => expressApp.listen(appConfigs.port, () => {
      expressLoaderLogger.info(`Server ON!! PORT: ${appConfigs.port} - PID: ${process.pid}`);
      res();
    }));
  }
}

module.exports = ExpressLoader;