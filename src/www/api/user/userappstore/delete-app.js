const userAppStore = require('../../../../../index.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.appid) {
      throw new Error('invalid-appid')
    }
    const app = await global.api.user.userappstore.App.get(req)
    if (!app) {
      throw new Error('invalid-appid')
    }
    await userAppStore.Storage.deleteFile(`app/${req.query.appid}`)
    await userAppStore.StorageList.remove(`account/apps/${req.account.accountid}`, req.query.appid)
    await userAppStore.StorageList.remove(`apps/${req.account.accountid}`, req.query.appid)
    req.success = true
  }
}
