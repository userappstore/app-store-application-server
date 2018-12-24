const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    return await userAppStore.StorageList.count(`published`)
  }
}
