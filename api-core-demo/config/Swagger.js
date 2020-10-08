module.exports = {
  info: {
    title: 'Demo API Documentation',
    version: '1.0.0'
  },
  grouping: 'tags',
  tags: [ ],
  securityDefinitions: {
    jwt: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header'
    },
  },
  security: [
    {
      jwt: [],
      checksum: []
    }
  ]
}