const SwaggerUIExpress = require('swagger-ui-express');
const _ = require('lodash');
const Filehound = require('filehound');
const J2S = require('joi-to-swagger');

class SwaggerExpress {
  
  constructor({ appPath, appName }) {
    this.appPath = appPath;
    this.expressPath = `${this.appPath}/express`;
    this.expressApiPath = `${this.expressPath}/api`;
    this.expressRoutePath = `${this.expressPath}/route`;
    this.postFix = 'Route';
    this.defaultSwaggerDefinition = {
      info: {
        title: 'API Docs',
        version: '1.0.0',
        description: `${appName} API documentation`
      },
      swagger: '2.0',
      // basePath: '/',
      expanded: 'list',
      grouping: 'tags',
      tags: [],
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
        }
      ],
      paths: {},
      definitions: {},
      responses: {},
      parameters: {},
      tags: []
    };
    
  }


  async loadRoutes({ expressApp }) {
    const apiFilePaths = await Filehound.create()
      .path(this.expressApiPath)
      .ext('.js')
      .glob(`*${this.postFix}.js`)
      .find();

    const routeFilePaths = await Filehound.create()
      .path(this.expressRoutePath)
      .ext('.js')
      .glob(`*${this.postFix}.js`)
      .find();

    const allRouteFilePaths = apiFilePaths.concat(routeFilePaths);
    _.forEach(allRouteFilePaths, (routeFilePath) => {
      let routes = require(routeFilePath) || [];
      if (!_.isArray(routes)) {
        routes = [ routes ]
      }

      _.forEach(routes, (route) => {
        let {
          isActive,
          method,
          path,
          handler,
          options = {},
        } = route;
        
        if (!isActive || !method || !path || !handler) {
          return;
        }

        //method = _.toUpper(method);

        let routeWithMethod = _.get(expressApp, _.toLower(method));
        if (routeWithMethod) {
          const routeInputs = []; //
          const validate = options.validate || {};
          if (validate.body) {
            routeInputs.push({
              name: 'body',
              in: 'body',
              description: 'request body',
              schema: J2S(validate.body).swagger,
            });
          }

          if (validate.params) {
            const paramsSwagger = J2S(validate.params).swagger || {};
            _.forEach(paramsSwagger.properties, (schema, prop) => {
              routeInputs.push({
                in: 'path',
                description: `param: ${prop}`,
                name: prop,
                schema,
                required: _.includes(paramsSwagger.required, prop)
              })
            })
          }

          if (validate.query) {
            const querySwagger = J2S(validate.query).swagger || {};
            _.forEach(querySwagger.properties, (schema, prop) => {
              routeInputs.push({
                in: 'query',
                description: `query: ${prop}`,
                name: prop,
                schema,
                required: _.includes(querySwagger.required, prop)
              })
            })
          }

          const responseStatus = {};
          if (options.responses) {
            _.forEach(options.responses, (joiSchema, code) => {
              const swagger = J2S(joiSchema).swagger;
              responseStatus[code] = {
                description: _.get(swagger, 'description', 'data'),
                schema: swagger
              }
            })
          }

          const swaggerRouteDefinition = {
            description: options.description || `${method} request to ${path}`,
            tags: options.tags || [],
            consumes: [    
              'application/json'
            ],    
            produces: [
              'application/json'
            ],
            parameters: routeInputs,
            responses: responseStatus,
          };

          const swaggerPath = _.replace(path, /\/(:([^\/]+))/g, '/{$2}');
          _.set(this.defaultSwaggerDefinition.paths, `${swaggerPath}.${_.toLower(method)}`, swaggerRouteDefinition);

        }
      });
    });
  
  }


  async load({ appConfigs, expressApp }) {

    const swaggerConfigs = _.get(appConfigs, 'swagger', {});
    const swaggerDefinition = _.merge(
      this.defaultSwaggerDefinition,
      swaggerConfigs
    );

    await this.loadRoutes({ expressApp });
    expressApp.use('/documentation', SwaggerUIExpress.serve, SwaggerUIExpress.setup(swaggerDefinition, ))
  }
}

module.exports = SwaggerExpress;