const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    return userAppStore.StorageList.count(`stripeid/published/${req.query.stripeid}`)
  }
}
