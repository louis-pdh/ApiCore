const Express = require('express');
require('express-async-errors');
const Dotenv = require('dotenv');
const UUID = require('uuid');

const Config = require('./libs/config');
const Logger = require('./libs/logger');
const Locale = require('./libs/locale');
const Mongoosee = require('./libs/mongoosee');
const Auth = require('./libs/auth');
const ExpressLoader = require('./libs/expressloader');
const Autoload = require('./libs/autoload');
const CronJob = require('./libs/cronjob');

const coreInstancesStore = {
  express: {}
};

class ExpressApiCore {

  constructor({ appPath, envPath, appName }) {
    this.appPath = appPath;
    this.envPath = envPath || `${this.appPath}/.env`;
    this.appName = appName || UUID.v4();
    coreInstancesStore.express[this.appName] = this;

    this.Config           = new Config({ appPath: this.appPath, });
    this.Logger           = new Logger({ appPath: this.appPath, });
    this.Locale           = new Locale({ appPath: this.appPath, });
    this.Mongoosee        = new Mongoosee({ appPath: this.appPath, });
    this.Auth             = new Auth({ appPath: this.appPath, });
    this.ExpressLoader    = new ExpressLoader({ appPath: this.appPath, });
    this.Autoload         = new Autoload({ appPath: this.appPath, });
    this.CronJob          = new CronJob({ appPath: this.appPath, });
  }

  async start() {
    Dotenv.config({
      path: this.envPath,
    });
    
    this.ExpressApp = Express();

    //
    await this.Config.load();
    await this.Logger.load({ expressApp: this.ExpressApp, appConfigs: this.AppConfigs, });
    await this.Locale.load({ appConfigs: this.AppConfigs, });
    await this.Mongoosee.load({ appConfigs: this.AppConfigs, });
    await this.Auth.load({ appConfigs: this.AppConfigs, });
    await this.ExpressLoader.load({ 
      expressApp:   this.ExpressApp, 
      appConfigs:   this.AppConfigs, 
      log4js:       this.Log4js, 
      i18nInstance: this.I18nInstance ,
      authHandlers: this.AuthHandlers,
    });
    await this.Autoload.load({ log4js: this.Log4js, });
    await this.CronJob.load({ log4js: this.Log4js, });
    //

  }

  get AppConfigs() { return this.Config.appConfigs; }
  get I18nInstance() { return this.Locale.i18n; }
  get Log4js(){ return this.Logger.Log4js; }
  get Models() { return this.Mongoosee.models; }
  get AuthHandlers() { return this.Auth.authHandlers; }
}

module.exports = {
  ExpressApiCore,
  Mongoose: require('mongoose'),
  I18n: require('i18n'),
  getCoreInstance: (type, name) => _.get(coreInstancesStore, `${type}.${name}`),
}