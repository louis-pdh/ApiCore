const _ = require('lodash');

class Auth {

  constructor({ appPath }) {
    this.appPath = appPath;
    this.requestExtractors = {};
    this.validators = {};
    this.authHandlers = {};
  }

  async load({ appConfigs }) {

    const authConfigs = appConfigs.auth || {};
    this.requestExtractors = authConfigs.requestExtractors;
    this.validators = authConfigs.validators;
    _.forEach(authConfigs.validators, (validator, name) => {
      const { extractor, validate } = validator;
      const extractRequestFunction = this.requestExtractors[extractor];
      if (!extractRequestFunction) {
        throw new Error(`Request extractor ${extractor} does not exist`);
      }
      if (!validate) {
        throw new Error(`Require validate function at extractor ${extractor}`);
      }

      const validatorWithExtractor = async (req, res, next) => {
        const params = await extractRequestFunction(req);
        await validate(params, req, res, next);
      }

      this.authHandlers[name] = validatorWithExtractor;
    })
  }

}

module.exports = Auth;