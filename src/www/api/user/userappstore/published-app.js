const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.appid) {
      throw new Error('invalid-appid')
    }
    let app = await userAppStore.Storage.read(`app/${req.query.appid}`)
    if (!app) {
      throw new Error('invalid-appid')
    }
    app = JSON.parse(app)
    if (!app.published || app.unpublished) {
      throw new Error('invalid-app')
    }
    return app
  }
}
