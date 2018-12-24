const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.installid) {
      throw new Error('invalid-installid')
    } 
    let install = await userAppStore.Storage.read(`install/${req.query.installid}`)
    if (!install || !install.length) {
      throw new Error('invalid-installid')
    }
    install = JSON.parse(install)
    if (install.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    return install
  }
}
