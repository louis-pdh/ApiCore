const Mongoose = require('mongoose');
const Async = require('async');
const Filehound = require('filehound');
const _ = require('lodash');
const Fs = require('fs');
const Path = require('path');
const Utils = require('./utils');

async function createConnection(uri, opts) {
  return new Promise((resolve, reject) => {
    const connection = Mongoose.createConnection(uri, opts);

    connection.on('error', reject);
    connection.on('open', () => { resolve(connection); });
  })
}

class Mongoosee {

  constructor({ appPath }) {
    this.appPath = appPath;
    this.modelPath = `${this.appPath}/model`;
    this.postFix = 'Model';
    this.connections = {};
    this.models = {};
    this.defaulConnectionOptions =  {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true
    }
  }

  async load({ appConfigs = {}}) {
    if (!Fs.existsSync(this.modelPath)) {
      Fs.mkdirSync(this.modelPath);
    }

    const connectionConfigs = _.get(appConfigs, 'mongodb.connections', {});
    const errors = [];
    await Async.eachOfSeries(connectionConfigs, async (connectionConfig, key) => {
      try {
        const connectionUri = connectionConfig.uri;
        const connectionOptions = _.isEmpty(connectionConfig.options) ? this.defaulConnectionOptions : connectionConfig.options;
        const connection = await createConnection(connectionUri, connectionOptions);
        this.connections[key] = connection;
      } catch (error) {
        errors.push(`[${key}] connection error - ${error.message}`);
      }
    });

    if (errors.length) {
      throw new Error(`Mongoose errors: \n${errors.join('\n')}`);
    }

    const modelFilePaths = await Filehound.create()
      .path(this.modelPath)
      .ext('.js')
      .glob(`*${this.postFix}.js`)
      .find();

    _.forEach(modelFilePaths, (modelFilePath) => {
      const modelConfigs = require(modelFilePath);
      const modelName = Path.basename(modelFilePath).replace(`${this.postFix}.js`, '');
      const connection = this.connections[modelConfigs.connection];
      if (connection) {
        modelConfigs.attributes.options.collection = modelConfigs.collectionName;
        modelConfigs.attributes.options.versionKey = false;
        this.models[modelName] = connection.model(modelConfigs.collectionName, modelConfigs.attributes);
        Utils.setRequireCache(modelFilePath, this.models[modelName]);
      } else {
        errors.push(`[${modelConfigs.connection}] is invalid at ${modelFilePath}`);
      }
    });
    if (errors.length) {
      throw new Error(`Mongoose errors: \n${errors.join('\n')}`);
    }
    
  }
}

module.exports = Mongoosee;