const Mongoose = require('hh-api-core').Mongoose;

module.exports = {
  connection: 'default', // type of connection defined in config.mongodb
  collectionName: 'test1', // collection (table) name
  attributes: new Mongoose.Schema({ // fields of documents in collection
    name: String,
  }, { timestamps: true }),
};