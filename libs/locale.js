const { I18n } = require('i18n');
const Fs = require('fs');
const _ = require('lodash');

class Locale {
  
  constructor({ appPath }) {
    this.appPath = appPath;
    this.localePath = `${this.appPath}/locales`;
  }

  async load({ appConfigs }) {
    if (!Fs.existsSync(this.localePath)) {
      Fs.mkdirSync(this.localePath);
    }

    const i18nConfigs = _.get(appConfigs, 'i18n', {});
    
    this.i18n = new I18n({
      locales: i18nConfigs.locales,
      directory: this.localePath
    })
  }
}

module.exports = Locale;