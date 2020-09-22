

module.exports = {
  port: process.env.PORT, // define app's port in .env file
  saltRound: 10, // password hasing number of salt round 
  // cors: { ... }, cors configs (cors npm)
  // helmet: { ... }, helmet configs (helmet npm)
  logger: { // logger configs
    log4js: {
      appenders: { 
        console: { type: 'console' }
      }, 
      categories: {
        cronjob: { appenders: ['console'], level: 'all' },
        system: { appenders: ['console'], level: 'all' },
        default: { appenders: ['console'], level: 'all' }
      }
    }
  },

  mongodb: { // mongodb configs, multi connections
    connections: {
      default: {
        uri: 'mongodb://localhost:27017/using-apicore-1',
        // options: { ... } connection options (mongoose npm)
      },
      common: {
        uri: 'mongodb://localhost:27017/using-apicore-2',
        // options: { ... } connection options (mongoose npm)
      }
    }
  }
}