const Fs = require('fs');
const _ = require('lodash');
const Filehound = require('filehound');
const Path = require('path');
const Utils = require('./utils');

class Config {
  constructor({ appPath }) {
    this.appPath = appPath;
    this.configPath = `${appPath}/config`;
    this.postFix = 'Config';
    this.defaultConfigPath = `${this.configPath}/DefaultConfig.js`;
    this.appConfigs = {};
  }

  async load() {
    
    if (!Fs.existsSync(this.configPath)) {
      Fs.mkdirSync(this.configPath);
    }

    const nodeEnv = process.env.NODE_ENV;
    if (!nodeEnv) {
      throw new Error("Require NODE_ENV in env config");
    }

    const envConfigPath  = `${this.configPath}/env/${_.upperFirst(_.toLower(nodeEnv))}.js`; //ex: .../Development.js
    let envConfigs = {};
    if (Fs.existsSync(envConfigPath)) {
      envConfigs = require(envConfigPath) || {};
    }

    let defaultConfigs = {};
    const configFilePaths = await Filehound.create()
    .path(this.configPath)
    .ext('.js')
    .glob(`*.js`)
    .depth(0)
    .find();

    _.forEach(configFilePaths, (configFilePath) => {
      const configName = _.lowerFirst(Path.basename(configFilePath).replace(`.js`, ''));
      const config = require(configFilePath) || {};
      defaultConfigs[configName] = config;
    })

    this.appConfigs = _.merge(defaultConfigs, envConfigs);
    //Utils.setRequireCache(this.configPath, this.appConfigs);
  }
}

module.exports = Config;