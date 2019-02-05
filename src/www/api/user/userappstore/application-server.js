const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.serverid) {
      throw new Error('invalid-application-serverid')
    }
    let server = await userAppStore.Storage.read(`server/${req.query.serverid}`)
    if (!server || !server.length) {
      throw new Error('invalid-application-serverid')
    }
    server = JSON.parse(server)
    return server
  }
}
