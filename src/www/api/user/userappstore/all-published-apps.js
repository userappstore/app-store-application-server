const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    if (req.query.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    let appids
    if (req.query.all) {
      appids = await userAppStore.StorageList.listAll(`published`)
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      appids = await userAppStore.StorageList.list(`published`, offset)
    }
    if (!appids || !appids.length) {
      return null
    }
    const apps = []
    for (const appid of appids) {
      req.query.appid = appid
      const app = await global.api.user.userappstore.PublishedApp.get(req)
      apps.push(app)
    }
    return apps
  }
}
