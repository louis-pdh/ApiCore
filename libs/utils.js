const _ = require('lodash');

module.exports = {
  setRequireCache: (path, data) => {
    path = require.resolve(path);
    if (_.isUndefined(require.cache[path].exports) === false) {
      require.cache[path].exports = data;
      return true;
    }
    return false;
  }
}