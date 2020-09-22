// route object or array of route objects
module.exports = {
  isActive: true,
  method: 'GET',
  path: '/health-check',
  handler: (req, res) => {
    res.status(200).json({ message: 'Im OK!' });
  }
}