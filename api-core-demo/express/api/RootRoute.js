// route object or array of route objects
module.exports = [
  {
    isActive: true,
    method: 'GET',
    path: '/',
    handler: (req, res) => {
      const message = res.__("Hello World!! Im {{name}}", { name: 'HauDepTrai' })
      res.status(200).json({ message });
    }
  }
]