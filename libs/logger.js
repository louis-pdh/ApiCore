const Log4js = require('log4js');
const Morgan = require('morgan');
const _ = require('lodash');

class Logger  {

  constructor({  }) {
    this.defaultLog4jsConfigs = {
      appenders: { 
        console: { type: 'console' }
      }, 
      categories: {
        cronjob: { appenders: ['console'], level: 'all' },
        system: { appenders: ['console'], level: 'all' },
        default: { appenders: ['console'], level: 'all' }
      }
    }
  }

  async load({ expressApp, appConfigs = {} }) {

    const loggerConfigs = appConfigs.logger || {};
    const requestLogger = Log4js.getLogger('system');
    expressApp.use(Morgan(function (tokens, req, res) {
      requestLogger.info([
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        '-',
        tokens['response-time'](req, res), 'ms'
      ].join(' '));
    }));

    Log4js.configure(_.get(loggerConfigs, 'log4js', this.defaultLog4jsConfigs));
    this.Log4js = Log4js;
  } 
}


module.exports = Logger;