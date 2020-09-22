
// run some task after server startup
module.exports = {
  isActive: true, // enable true to load
  onLoad: () => { // performed function
    console.log("Im loaded after server startup")
  },
}