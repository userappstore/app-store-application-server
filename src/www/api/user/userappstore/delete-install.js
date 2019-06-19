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
    await userAppStore.Storage.write(`map/uninstall/install/${installid}`, uninstallid)
    await userAppStore.StorageList.add(`account/uninstalls/${install.accountid}`, uninstallid)
    await userAppStore.StorageList.add(`uninstalls`, uninstallid)
    await userAppStore.Storage.deleteFile(`install/${req.query.installid}`)
    await userAppStore.StorageList.remove(`installs`, req.query.installid)
    await userAppStore.StorageList.remove(`account/installs/${req.account.accountid}`, req.query.installid)
    if (install.organizationid) {
      await userAppStore.StorageList.remove(`organization/installs/${install.organizationid}`, req.query.installid)
    }
    req.success = true
    return uninstall
  }
}
