const Cron = require('cron');
const Filehoud = require('filehound');
const _ = require('lodash');
const Fs = require('fs');
const Path = require('path');

class CronJob {

  constructor({ appPath }) {
    this.appPath = appPath;
    this.cronJobPath = `${this.appPath}/cronjob`;
    this.postFix = 'CronJob';
    this.cronJobs = {}
    this.defaultJobCronExpression = '* * * * * *';
    this.defaultJobOptions = {
      timeZone: 'Asia/Ho_Chi_Minh',
      runOnInit: false
    };
  }

  async load({ log4js }) {
    if (!Fs.existsSync(this.cronJobPath)) {
      Fs.mkdirSync(this.cronJobPath);
    }

    const cronJobFilePaths = await Filehoud.create()
      .path(this.cronJobPath)
      .ext('.js')
      .glob(`*${this.postFix}.js`)
      .find();
      
    _.forEach(cronJobFilePaths, (cronJobFilePath) => {
      const jobName = Path.basename(cronJobFilePath).replace(`${this.postFix}.js`, '');
      const job = require(cronJobFilePath);
      const jobActive = _.get(job, 'isActive');
      if (!jobActive) {
        return;
      }

      const expression = _.get(job, 'expression', this.defaultJobCronExpression);
      const jobOpts = _.get(job, 'options', this.defaultJobOptions);
      const onTick = _.get(job, 'onTick');
      if (!_.isFunction(onTick)) {
        throw new Error('CronJob require onTick function');
      }

      const cronJobLogger = log4js.getLogger('cronjob');

      if (jobOpts.runOnInit) {
        onTick();
      }

      new Cron.CronJob(expression, () => {
        cronJobLogger.trace(`${jobName} onTick at`, new Date());
        onTick();
      }, null, true, jobOpts.timeZone);

    })
  }

}

module.exports = CronJob;