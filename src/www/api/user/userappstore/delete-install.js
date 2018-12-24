const userAppStore = require('../../../../../index.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.installid) {
      throw new Error('invalid-installid')
    }
    const install = await global.api.user.userappstore.Install.get(req)
    if (install.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    let uninstallid = userAppStore.UUID.friendly()
    let exists = await userAppStore.Storage.exists(`uninstall/${uninstallid}`)
    if (exists) {
      while (exists) {
        uninstallid = userAppStore.UUID.friendly()
        exists = await userAppStore.Storage.exists(`uninstall/${uninstallid}`)
      }
    }
    const uninstall = {
      object: 'uninstall',
      uninstallid,
      install,
      accountid: install.accountid,
      created: userAppStore.Timestamp.now
    }
    await userAppStore.Storage.write(`uninstall/${uninstallid}`, uninstall)
    await userAppStore.StorageList.add(`account/uninstalls/${install.accountid}`, uninstallid)
    req.success = true
    return uninstall
  }
}
