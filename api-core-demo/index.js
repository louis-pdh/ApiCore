const ApiCore = require('hh-api-core');

async function bootstrap() {
  const expressApiCore = new ApiCore.ExpressApiCore({
    appName: 'Demo',
    appPath: __dirname
  });

  await expressApiCore.start()
}

bootstrap();