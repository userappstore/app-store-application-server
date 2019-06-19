const userAppStore = require('../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.dashboardServer) {
      return
    }
    if (!req.query || !req.query.installid) {
      throw new Error('invalid-installid')
    }
    let install = await userAppStore.Storage.read(`install/${req.query.installid}`)
    if (!install || !install.length) {
      const uninstallid = await userAppStore.Storage.read(`map/uninstall/install/${req.query.installid}`)
      if (uninstallid) {
        let uninstall = await userAppStore.Storage.read(`uninstall/${uninstallid}`)
        if (uninstall && uninstall.length) {
          uninstall = JSON.parse(uninstall)
          return uninstall.install
        }
      }
      throw new Error('invalid-installid')
    }
    install = JSON.parse(install)
    return install
  }
}
