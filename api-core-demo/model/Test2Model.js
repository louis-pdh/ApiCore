const Mongoose = require('hh-api-core').Mongoose;

module.exports = {
  connection: 'common',
  collectionName: 'test2',
  attributes: new Mongoose.Schema({
    name: String,
  }, { timestamps: true }),
};