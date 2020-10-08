
module.exports = { // logger configs
  log4js: {
    appenders: { 
      console: { type: 'console' },
      multiFile: { type: 'multiFile', base: 'logs/', property: 'categoryName', extension: '.log' }
    }, 
    categories: {
      cronjob: { appenders: ['console'], level: 'all' },
      system: { appenders: ['console'], level: 'all' },
      default: { appenders: ['console'], level: 'all' }
    }
  }
};