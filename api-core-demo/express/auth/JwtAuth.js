const Jsonwebtoken = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader) {
    token = authHeader.split(' ').pop();
  };

  if (token) {
    Jsonwebtoken.verify(token, process.env.JWT_SECRET, (err, payload) => {
      if (err) return res.status(401).json({ message: 'Invalid token' });
      req.user = payload;
      next();
    });
  } else {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}