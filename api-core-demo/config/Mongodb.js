
module.exports = { // mongodb configs, multi connections
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
};