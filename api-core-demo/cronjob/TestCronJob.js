
// background job that run at scheduled time
module.exports = {
  isActive: false, // enable true to load
  expression: '*/2 * * * * *', // scheduled time
  onTick: () => { // performed function
    console.log("tick tock")
  },
  options: {
    timeZone: 'Asia/Ho_Chi_Minh', // timezone for "expression" time config
    runOnInit: false // run when cronjob loaded (before server startup)
  }
}