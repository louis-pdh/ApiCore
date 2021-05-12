const SwaggerUIExpress = require('swagger-ui-express')
const _ = require('lodash')
const Filehound = require('filehound')
const J2S = require('joi-to-swagger')

class SwaggerExpress {
  constructor({ appPath, appName, }) {
    this.appPath = appPath
    this.modulePath = `${this.appPath}/modules`
    this.expressApiPath = `${this.expressPath}/api`
    this.expressRoutePath = `${this.expressPath}/route`
    this.routePostFix = 'Route'
    this.inputValidations = {}
    this.defaultSwaggerDefinition = {
      info: {
        title: 'API Docs',
        version: '1.0.0',
        description: `${appName} API documentation`,
      },
      openapi: '3.0.0',
      // basePath: '/',
      expanded: 'list',
      grouping: 'tags',
      tags: [],
      securityDefinitions: {
        jwt: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
        },
      },
      security: [
        {
          jwt: [],
        },
      ],
      paths: {},
      definitions: {},
      responses: {},
      parameters: {},
    }
  }

  async loadRoutes({ expressApp, }) {
    const apiFilePaths = await Filehound.create()
      .path(this.modulePath)
      .ext('.js')
      .glob(`*${this.routePostFix}.js`)
      .find()

    // const routeFilePaths = await Filehound.create()
    //   .path(this.expressRoutePath)
    //   .ext('.js')
    //   .glob(`*${this.postFix}.js`)
    //   .find()

    const allRouteFilePaths = apiFilePaths // apiFilePaths.concat(routeFilePaths)
    _.forEach(allRouteFilePaths, (routeFilePath) => {
      let routes = require(routeFilePath) || []
      if (!_.isArray(routes)) {
        routes = [ routes, ]
      }

      _.forEach(routes, (route) => {
        const {
          isActive,
          method,
          path,
          handler,
          docs = true,
          options = {},
        } = route
        
        if (!isActive || !method || !path || !handler || !docs) {
          return
        }

        // method = _.toUpper(method);

        const routeWithMethod = _.get(expressApp, _.toLower(method))
        if (routeWithMethod) {
          const routeInputs = [] //
          const validate = options.validate || {}
          let requestBody = null
          if (validate.body) {
            requestBody = {
              content: {
                'application/json': {
                  schema: J2S(validate.body).swagger,
                },
              },
              description: 'body data',
            }
          }

          if (validate.params) {
            const paramsSwagger = J2S(validate.params).swagger || {}
            _.forEach(paramsSwagger.properties, (schema, prop) => {
              routeInputs.push({
                in: 'path',
                description: `param: ${prop}`,
                name: prop,
                schema,
                required: _.includes(paramsSwagger.required, prop),
              })
            })
          }

          if (validate.query) {
            const querySwagger = J2S(validate.query).swagger || {}
            _.forEach(querySwagger.properties, (schema, prop) => {
              routeInputs.push({
                in: 'query',
                description: `query: ${prop}`,
                name: prop,
                schema,
                required: _.includes(querySwagger.required, prop),
              })
            })
          }

          const responseStatus = {}
          if (options.responses) {
            _.forEach(options.responses, (joiSchema, code) => {
              const swagger = J2S(joiSchema).swagger
              responseStatus[code] = {
                description: _.get(swagger, 'description', 'data'),
                content: {
                  'application/json': {
                    schema: swagger,
                  },
                },
              }
            })
          }

          const swaggerRouteDefinition = {
            description: options.description || `${method} request to ${path}`,
            tags: options.tags || [],
            consumes: [    
              'application/json',
            ],    
            produces: [
              'application/json',
            ],
            requestBody,
            parameters: routeInputs,
            responses: responseStatus,
          }

          // eslint-disable-next-line no-useless-escape
          const swaggerPath = _.replace(path, /\/(:([^\/]+))/g, '/{$2}')
          _.set(this.defaultSwaggerDefinition.paths, `${swaggerPath}.${_.toLower(method)}`, swaggerRouteDefinition)
          _.set(this.inputValidations, `${path}.${_.toLower(method)}`, options.validate || {})
        }
      })
    })
  }

  async load({ appConfigs, expressApp, }) {
    const swaggerConfigs = _.get(appConfigs, 'swagger', {})
    const isActive = _.get(swaggerConfigs, 'isActive', false)
    if (!isActive) return
    
    const swaggerDefinition = _.merge(
      this.defaultSwaggerDefinition,
      _.get(swaggerConfigs, 'definition', {})
    )

    await this.loadRoutes({ expressApp, })
    expressApp.use('/documentation', SwaggerUIExpress.serve, SwaggerUIExpress.setup(swaggerDefinition,))
  }
}

module.exports = SwaggerExpress
