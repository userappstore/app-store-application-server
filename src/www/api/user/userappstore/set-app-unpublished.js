const userAppStore = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.appid) {
      throw new Error('invalid-appid')
    }
    const app = await global.api.user.userappstore.App.get(req)
    if (app.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    if (!app.published || app.unpublished) {
      throw new Error('invalid-app')
    }
    app.unpublished = userAppStore.Timestamp.now
    await userAppStore.StorageObject.setProperty(`app/${app.appid}`, 'unpublished', app.unpublished)
    await userAppStore.StorageList.add(`unpublished`, app.appid)
    await userAppStore.StorageList.add(`account/unpublished/${req.account.accountid}`, app.appid)
    await userAppStore.StorageList.remove(`published`, app.appid)
    await userAppStore.StorageList.remove(`account/published/${req.account.accountid}`, app.appid)
    req.success = true
    return app
  }
}
