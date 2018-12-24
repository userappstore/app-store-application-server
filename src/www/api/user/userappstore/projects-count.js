const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    return userAppStore.StorageList.count(`account/projects/${req.account.accountid}`)
  }
}
