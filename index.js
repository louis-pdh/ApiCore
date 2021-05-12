const Express = require('express')
require('express-async-errors')
const Dotenv = require('dotenv')
const UUID = require('uuid')

const Config = require('./libs/config')
const Logger = require('./libs/logger')
const Locale = require('./libs/locale')
const Mongoosee = require('./libs/mongoosee')
const ModuleLoader = require('./libs/module_loader')
const Autoload = require('./libs/autoload')
const CronJob = require('./libs/cronjob')

class ExpressApiCore {
  constructor({ appPath, envPath, appName, }) {
    this.appPath = appPath
    this.envPath = envPath || `${this.appPath}/.env`
    this.appName = appName || UUID.v4()

    this.Config           = new Config({ appPath: this.appPath, })
    this.Logger           = new Logger({ appPath: this.appPath, })
    this.Locale           = new Locale({ appPath: this.appPath, })
    this.Mongoosee        = new Mongoosee({ appPath: this.appPath, })
    // this.Auth             = new Auth({ appPath: this.appPath, });
    this.ModuleLoader    = new ModuleLoader({ appPath: this.appPath, appName: this.appName, })
    this.Autoload         = new Autoload({ appPath: this.appPath, })
    this.CronJob          = new CronJob({ appPath: this.appPath, })
  }

  async start() {
    Dotenv.config({
      path: this.envPath,
    })
    
    this.ExpressApp = Express()

    //
    await this.Config.load()
    await this.Logger.load({ expressApp: this.ExpressApp, appConfigs: this.AppConfigs, })
    await this.Locale.load({ appConfigs: this.AppConfigs, })
    await this.Mongoosee.load({ appConfigs: this.AppConfigs, })
    await this.ModuleLoader.load({ 
      expressApp:   this.ExpressApp, 
      appConfigs:   this.AppConfigs, 
      log4js:       this.Log4js, 
      i18nInstance: this.I18nInstance,
      mongooseConnections: this.Mongoosee.connections,
      mongooseModels: this.Mongoosee.models,
    })
    await this.Autoload.load({ log4js: this.Log4js, })
    await this.CronJob.load({ log4js: this.Log4js, })
    //
  }

  get AppConfigs() { return this.Config.appConfigs }

  get I18nInstance() { return this.Locale.i18n }

  get Log4js() { return this.Logger.Log4js }

  get Models() { return this.Mongoosee.models }

  get MongooseConnections() { return this.Mongoosee.connections }

  get AuthHandlers() { return this.ModuleLoader.Auth.authHandlers }
}

module.exports = {
  ExpressApiCore,
  Mongoose:       require('mongoose'),
  Joi:            require('joi'),
  I18n:           require('i18n'),
  Async:          require('async'),
  BodyParser:     require('body-parser'),
  Cors:           require('cors'),
  Cron:           require('cron'),
  DotEnv:         require('dotenv'),
  Express:        require('express'),
  Filehound:      require('filehound'),
  Helmet:         require('helmet'),
  JsonWebToken:   require('jsonwebtoken'),
  Lodash:         require('lodash'),
  _:              require('lodash'),
  Log4js:         require('log4js'),
  UUID:           require('uuid'),
  NodeRSA:        require('node-rsa'),
  CryptoJS:       require('crypto-js'),
  Crypto:         require('crypto'),
  ShortId:        require('shortid'),
}
