const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    return userAppStore.AppStore.countUnpublished()
  }
}
