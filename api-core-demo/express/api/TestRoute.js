const Joi = require('hh-api-core').Joi;
// route object or array of route objects
module.exports = {
  isActive: true,
  method: 'POST',
  path: '/test/:name',
  handler: (req, res) => {
    console.log(req.params);
    return res.api({ name: req.params.name }).code(1000);
  },
  options: {
    tags: ['api', 'test'],
    validate: {
      params: Joi.object({
        name: Joi.string().description('params name')
      }),
    },
    responses: {
      '1000': Joi.object({
        name: Joi.string().example('hau').description('name')
      }).description('success'),
      '1001': Joi.object({
        message: Joi.string().example('ngu').description('err msg')
      }).description('fail')
    }
  }
}