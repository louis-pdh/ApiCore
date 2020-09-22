const Filehound = require('filehound');
const Path = require('path');
const Fs = require('fs');
const _ = require('lodash');

class Autoload {

  constructor({ appPath }) {
    this.appPath = appPath;
    this.autoloadPath = `${this.appPath}/autoload`;
    this.postFix = 'Autoload';
  } 


  async load({ log4js }) {
    if (!Fs.existsSync(this.autoloadPath)) {
      Fs.mkdirSync(this.autoloadPath);
    }
    const autoloadLogger = log4js.getLogger('system');
    const autoloadFilePaths = await Filehound.create()
    .path(this.autoloadPath)
    .ext('.js')
    .glob(`*${this.postFix}.js`)
    .find();

    _.forEach(autoloadFilePaths, (autoloadFilePath) => {
      const autoloadName = Path.basename(autoloadFilePath).replace(`${this.postFix}.js`, '');
      const autoload = require(autoloadFilePath);
      if (_.get(autoload, 'isActive')) {
        autoloadLogger.info(`Autoload ${autoloadName} onLoad`);

        const onLoad = _.get(autoload, 'onLoad', () => {
          autoloadLogger.warn(`Not found function 'onLoad' at Autoload ${autoloadName}`);
        });

        onLoad();
      }
    })
  }
}

module.exports = Autoload;