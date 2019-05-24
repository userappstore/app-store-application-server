const userAppStore = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.serverid) {
      throw new Error('invalid-application-serverid')
    }
    const server = await global.api.user.userappstore.ApplicationServer.get(req)
    if (!server) {
      throw new Error('invalid-server')
    }
    server.applicationServerToken = userAppStore.UUID.random(64)
    await userAppStore.Storage.write(`server/${server.serverid}`, server)
    req.success = true
    return server
  }
}
