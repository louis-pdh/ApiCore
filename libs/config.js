const Fs = require('fs');
const _ = require('lodash');

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

    const envConfigPath  = `${this.configPath}/${_.upperFirst(_.toLower(nodeEnv))}${this.postFix}.js`; //ex: .../DevelopmentConfig
    let envConfigs = {};
    if (Fs.existsSync(envConfigPath)) {
      envConfigs = require(envConfigPath) || {};
    }

    let defaultConfigs = {};
    if (Fs.existsSync(this.defaultConfigPath)) {
      defaultConfigs = require(this.defaultConfigPath) || {};
    }

    this.appConfigs = { ...defaultConfigs, ...envConfigs };
    
  }
}

module.exports = Config;