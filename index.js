const Express = require('express');
const Dotenv = require('dotenv');
const BodyParser = require('body-parser');

const Config = require('./libs/config');
const Logger = require('./libs/logger');
const CronJob = require('./libs/cronjob');

let coreInstance  = null;

class ExpressApiCore {

  constructor({ appPath, envPath, appName }) {
    coreInstance = this;
    this.appPath = appPath;
    this.envPath = envPath || `${this.appPath}/.env`;
    this.appName = appName;

    this.Config = new Config({ appPath: this.appPath, });
    this.Logger = new Logger({ appPath: this.appPath, });
    this.CronJob = new CronJob({ appPath: this.appPath, });
  }

  async start() {
    Dotenv.config({
      path: this.envPath,
    });
    
    this.expressApp = Express();

    //
    await this.Config.load();
    await this.Logger.load({ expressApp: this.expressApp, appConfigs: this.getAppConfigs(), });
    await this.CronJob.load({ log4js: this.getLog4js(), });
    //

    this.expressApp.use(BodyParser.urlencoded({ extended: false }));
    this.expressApp.use(BodyParser.json());
    this.expressApp.get('/', (req, res) => res.send("Hello World!!"));
    
    const appConfigs = this.getAppConfigs();
    const logger = this.getLog4js().getLogger('system');
    await new Promise(res => this.expressApp.listen(appConfigs.port, () => {
      logger.info('Server ON!! PORT:', appConfigs.port);
      res();
    }));
  }

  getExpressApp() {
    return this.expressApp;
  }

  getAppConfigs() {
    return this.Config.appConfigs;
  }

  getLog4js(){
    return this.Logger.Log4js;
  }
}

module.exports = {
  ExpressApiCore,
  getCoreInstance: () => coreInstance,

}