const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.appid) {
      throw new Error('invalid-appid')
    }
    req.query.accountid = req.account.accountid
    req.query.all = true
    const installs = await global.api.user.userappstore.Installs.get(req)
    let found
    for (const install of installs) {
      if (install.appid !== req.query.appid) {
        continue
      }
      found = true
      break
    }
    if (!found) {
      throw new Error('invalid-appid')
    }
    let app = await userAppStore.Storage.read(`app/${req.query.appid}`)
    if (!app) {
      throw new Error('invalid-appid')
    }
    app = JSON.parse(app)
    return app
  }
}
