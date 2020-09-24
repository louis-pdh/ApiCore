
module.exports = { // logger configs
  log4js: {
    appenders: { 
      console: { type: 'console' },
      multiFile: { type: 'multiFile', base: 'logs/', property: 'categoryName', extension: '.log' }
    }, 
    categories: {
      cronjob: { appenders: ['multiFile'], level: 'all' },
      system: { appenders: ['multiFile'], level: 'all' },
      default: { appenders: ['multiFile'], level: 'all' }
    }
  }
};