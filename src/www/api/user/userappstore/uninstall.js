const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.uninstallid) {
      throw new Error('invalid-uninstallid')
    }
    let uninstall = await userAppStore.Storage.read(`uninstall/${req.query.uninstallid}`)
    if (!uninstall || !uninstall.length) {
      throw new Error('invalid-uninstallid')
    }
    uninstall = JSON.parse(uninstall)
    if (uninstall.object !== 'uninstall') {
      throw new Error('invalid-uninstall')
    }
    if (uninstall.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    return uninstall
  }
}
