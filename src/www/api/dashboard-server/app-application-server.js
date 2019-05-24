const userAppStore = require('../../../../index.js')

module.exports = {
  auth: false,
  get: async (req) => {
    if (!req.dashboardServer) {
      return
    }
    if (!req.query || !req.query.appid) {
      throw new Error('invalid-appid')
    }
    let app = await userAppStore.Storage.read(`app/${req.query.appid}`)
    if (!app || !app.length) {
      throw new Error('invalid-appid')
    }
    app = JSON.parse(app)
    if (!app.serverid) {
      throw new Error('invalid-app')
    }

    let server = await userAppStore.Storage.read(`server/${app.serverid}`)
    if (!server || !server.length) {
      throw new Error('invalid-application-serverid')
    }
    server = JSON.parse(server)
    return server
  }
}
