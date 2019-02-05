const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    let appids
    if (req.query.all) {
      appids = await userAppStore.StorageList.listAll(`stripeid/published/${req.query.stripeid}`)
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      appids = await userAppStore.StorageList.list(`stripeid/published/${req.query.stripeid}`, offset)
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
