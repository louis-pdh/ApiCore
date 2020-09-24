const Jsonwebtoken = require('jsonwebtoken');

module.exports = {
  requestExtractors: {
    jwtExtractor: function (req) {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.split(' ').pop();
        return { token };
      };
      return {};
    }
  },
  validators: {
    jwt: {
      extractor: 'jwtExtractor',
      validate: function ({ token }, req, res, next) {
        if (token) {
          Jsonwebtoken.verify(token, process.env.JWT_SECRET, (err, payload) => {
            if (err) return res.status(401).json({ message: 'Unauthorized' });
            req.user = payload;
            next();
          });
        } else {
          return res.status(401).json({ message: 'Unauthorized' });
        }
      }
    }
  }
};