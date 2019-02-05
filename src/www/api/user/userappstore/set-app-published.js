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
    if (app.published) {
      throw new Error('invalid-app')
    }
    app.published = userAppStore.Timestamp.now
    await userAppStore.StorageObject.setProperty(`app/${app.appid}`, 'published', app.published)
    await userAppStore.StorageList.add(`published`, app.appid)
    await userAppStore.StorageList.add(`account/published/${req.account.accountid}`, app.appid)
    await userAppStore.StorageList.add(`stripeid/published/${app.stripeid}`, app.appid)
    req.success = true
    return app
  }
}
