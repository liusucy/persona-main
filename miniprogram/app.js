const store = require('./utils/store');

App({
  globalData: {
    version: '1.0.0'
  },

  onLaunch() {
    store.ensureDefaults();
  }
});
