const _ = require('lodash');
const Path = require('path');
const Fs = require('fs');
const Filehound = require('filehound');

class Auth {

  constructor({ expressPath }) {
    this.expressPath = expressPath;
    this.authPath = `${this.expressPath}/auth`;
    this.postFix = 'Auth';
    this.authHandlers = {};
  }

  async load({}) {

    if (!Fs.existsSync(this.authPath)) {
      Fs.mkdirSync(this.authPath);
    }
    const authFilePaths = await Filehound.create()
      .path(this.authPath)
      .ext('.js')
      .glob(`*${this.postFix}.js`)
      .find();
      
    _.forEach(authFilePaths, (authFilePath) => {
      const authHandler = require(authFilePath);
      const authName = _.toLower(Path.basename(authFilePath).replace(`${this.postFix}.js`, ''));
      this.authHandlers[authName] = authHandler;
    });
  }

}

module.exports = Auth;