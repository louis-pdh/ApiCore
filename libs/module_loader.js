/* eslint-disable no-use-before-define */
/* eslint-disable prefer-rest-params */

const BodyParser = require('body-parser')
const Path = require('path')
const NodeRSA = require('node-rsa')
const CryptoJS = require('crypto-js')
const Crypto = require('crypto')
const ShortId = require('shortid')
const Filehound = require('filehound')
const Cors = require('cors')
const Helmet = require('helmet')
const Fs = require('fs')
const _ = require('lodash')
const Joi = require('joi')
const Swagger = require('./swagger')
const Auth = require('./auth')
const Utils = require('./utils')

class ModuleLoader {
  constructor({ appPath, appName, }) {
    this.appPath = appPath
    this.modulePath = `${this.appPath}/modules`
    // this.expressApiPath = `${this.expressPath}/api`
    // this.expressRoutePath = `${this.expressPath}/route`
    this.routePostFix = 'Route'
    this.modelPostFix = 'Model'
    this.Auth = new Auth({ expressPath: this.modulePath, })
    this.Swagger = new Swagger({ appPath, appName, })
  }

  async loadModules({ expressApp, authHandlers, mongooseConnections, mongooseModels, }) {
    const apiFilePaths = await Filehound.create()
      .path(this.modulePath)
      .ext('.js')
      .glob(`*${this.routePostFix}.js`)
      .find()

    // const routeFilePaths = await Filehound.create()
    //   .path(this.expressRoutePath)
    //   .ext('.js')
    //   .glob(`*${this.routePostFix}.js`)
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
          options = {},
        } = route
        
        if (!isActive || !method || !path || !handler) {
          return
        }

        // method = _.toUpper(method);

        let routeWithMethod = _.get(expressApp, _.toLower(method))
        if (routeWithMethod) {
          routeWithMethod = routeWithMethod.bind(expressApp)

          const preHandlers = [] // auth, validate, ...
          
          // auth
          const authName = options.auth
          let authHandler = authName ? this.Auth.authHandlers[authName] : null
          if (authHandler) {
            if (!_.isArray(authHandler)) authHandler = [ authHandler, ]
            preHandlers.push(...authHandler)
          }

          // validate input
          const inputValidate = _.get(this.Swagger.inputValidations, `${path}.${_.toLower(method)}`, {})
          if (!_.isEmpty(inputValidate)) {
            // eslint-disable-next-line no-inner-declarations
            async function validateInput(req, res, next) {
              const { params: paramsJoi, query: queryJoi, body: bodyJoi, } = inputValidate
              const validateJobs = []
              if (paramsJoi) validateJobs.push(paramsJoi.validateAsync(req.params))
              if (queryJoi) validateJobs.push(queryJoi.validateAsync(req.query))
              if (bodyJoi) validateJobs.push(bodyJoi.validateAsync(req.body))
              try {
                if (validateJobs.length) await Promise.all(validateJobs)
                next()
              } catch (error) {
                return res.status(400).json({ message: 'Invalid input', })
              }
            }

            preHandlers.push(validateInput)
          }
          routeWithMethod(path, preHandlers, handler)
        }
      })
    })
  }

  getResponseData(appConfigs, data) {

  }

  async load({ expressApp, appConfigs, log4js, i18nInstance, authHandlers, mongooseConnections, mongooseModels, }) {
    if (!Fs.existsSync(this.modulePath)) {
      Fs.mkdirSync(this.modulePath)
    }

    // if (!Fs.existsSync(this.expressApiPath)) {
    //   Fs.mkdirSync(this.expressApiPath)
    // }

    // if (!Fs.existsSync(this.expressRoutePath)) {
    //   Fs.mkdirSync(this.expressRoutePath)
    // }

    const expressLoaderLogger = log4js.getLogger('system.default')

    //
    await this.Auth.load()
    await this.Swagger.load({ appConfigs, expressApp, })
    
    //
    function apiSecurity(req, res, next) {
      res.api = function (data) {
        return res.status(200).json(data)
      }
      if (_.get(appConfigs, 'apiSecurity.isActive', true)) {
        // decrypt request
        let valid = API_SECURITY.DecryptRequest({
          req,
          res,
          appConfigs,
        })
        if (!valid) return
        // encrypt response 
        res.api = function (data) {
          [ valid, data, ] = API_SECURITY.EncryptResponse({
            req,
            res,
            appConfigs,
            data, 
          })
          if (!valid) return 
          return res.status(200).json(data)
        }
      }
      
      next()
    }
    
    expressApp.use(Helmet(_.get(appConfigs, 'helmet')))
    expressApp.use(Cors(_.get(appConfigs, 'cors')))
    expressApp.use(BodyParser.urlencoded({ extended: false, }))
    expressApp.use(BodyParser.json())
    expressApp.use(apiSecurity)
    expressApp.use(i18nInstance.init)

    //
    await this.loadModules({ expressApp, authHandlers, mongooseConnections, mongooseModels, })

    expressApp.use((req, res) => {
      return res.status(404).json({ message: 'Not Found', })
    })
    // 500 err
    const expressLoaderErrorLogger = log4js.getLogger('system.error')
    expressApp.use((err, req, res, next) => {
      expressLoaderErrorLogger.error(err.stack)
      return res.status(500).json({ message: 'Unknow error', })
    })

    //
    const PORT = process.env.PORT
    await new Promise((res) => expressApp.listen(PORT, () => {
      expressLoaderLogger.info(`Server ON!! PORT: ${PORT} - PID: ${process.pid}`)
      res()
    }))
  }
}

const API_SECURITY = {
  DecryptRequest: ({ req, res, appConfigs, }) => {
    if (['', '/', ].includes(req.url) === false) {
      res.status(400).json({
        message: 'Invalid request',
      })
      return false 
    }
    const xAPIKey = req.headers['x-api-key']
    const xAPIClient = req.headers['x-api-client']
    const xAPIAction = req.headers['x-api-action']
    const xAPIValidation = req.headers['x-api-validation']
    const xAPIMessage = _.get(req, 'body[\'x-api-message\']', '')
    const Authorization = _.get(req, 'headers.authorization', '')
    const rsaKey = _.get(appConfigs, `apiSecurity.client.${xAPIClient}`, null)
    if (!xAPIKey || !xAPIClient || !xAPIAction || !rsaKey || !xAPIValidation) {
      res.status(400).json({
        message: 'Invalid request',
      }) 
      return false
    }
    let aesKey = null
    try {
      const rsa = new NodeRSA(rsaKey.privateKey)
      aesKey = rsa.decrypt(xAPIKey, 'utf8')
      if (!aesKey) {
        res.status(400).json({
          message: 'Invalid request',
        }) 
        return false
      }
    } catch (err) {
      res.status(400).json({
        message: 'Invalid request',
      }) 
      return false
    }

    const validation = `${xAPIAction}_${_.toUpper(req.method)}_${Authorization}_${xAPIMessage}`
    const hmac = Crypto.createHmac('md5', aesKey).update(validation, 'utf8').digest('hex')
    if (hmac !== xAPIValidation) {
      res.status(400).json({
        message: 'Invalid request',
      })
      return false
    }
    let apiPath = null
    try {
      apiPath = CryptoJS.AES.decrypt(xAPIAction, aesKey).toString(CryptoJS.enc.Utf8)
    } catch (err) {
      res.status(400).json({
        message: 'Invalid request',
      })  
      return false 
    }
    req.url = apiPath

    let body = {}
    try {
      if (xAPIMessage !== '') {
        body = CryptoJS.AES.decrypt(xAPIMessage, aesKey).toString(CryptoJS.enc.Utf8)
        body = JSON.parse(body)
      }
    } catch (err) {
      res.status(400).json({
        message: 'Invalid request',
      })  
      return false 
    }

    req.body = body
    return true
  },
  EncryptResponse: ({ req, res, appConfigs, data, }) => {
    const xAPIClient = req.headers['x-api-client']
    const Authorization = _.get(req, 'headers.authorization', '')
    const rsaKey = _.get(appConfigs, `apiSecurity.client.${xAPIClient}`, null)
    if (!xAPIClient || !rsaKey) {
      res.status(400).json({
        message: 'Invalid request',
      }) 
      return [ false, null, ]
    }
    let xAPIKey = null
    let aesKey = null
    try {
      aesKey = ShortId.generate()
      const rsa = new NodeRSA(rsaKey.publicKey)
      xAPIKey = rsa.encrypt(aesKey, 'base64')
      if (!xAPIKey) {
        res.status(400).json({
          message: 'Invalid request',
        }) 
        return [ false, null, ]
      }
    } catch (err) {
      res.status(400).json({
        message: 'Invalid request',
      }) 
      return [ false, null, ]
    }

    const xAPIAction = CryptoJS.AES.encrypt(req.url, aesKey).toString()
    const xAPIMessage = CryptoJS.AES.encrypt(JSON.stringify(data), aesKey).toString()
    const validation = `${xAPIAction}_${_.toUpper(req.method)}_${Authorization}_${xAPIMessage}`
    const hmac = Crypto.createHmac('md5', aesKey).update(validation, 'utf8').digest('hex')
    
    res.set('x-api-key', xAPIKey)
    res.set('x-api-client', xAPIClient)
    res.set('x-api-action', xAPIAction)
    res.set('x-api-validation', hmac)

    return [ true, { 'x-api-message': xAPIMessage, }, ]
  },
}

module.exports = ModuleLoader
