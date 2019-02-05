const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.url) {
      throw new Error('invalid-url')
    }
    if (!req.query.url.startsWith('https://')) {
      throw new Error('invalid-url')
    }
    const domain = req.query.url.substring('https://'.length)
    // technically it is domain and optionally /path for eg github repos
    if (domain === global.domain) {
      throw new Error('invalid-domain')
    }
    let serverid = await userAppStore.Storage.read(`map/server/domain/${domain}`)
    if (!serverid || !serverid.length) {
      throw new Error('invalid-application-serverid')
    }
    let server = await userAppStore.Storage.read(`server/${serverid}`)
    if (!server || !server.length) {
      throw new Error('invalid-application-serverid')
    }
    server = JSON.parse(server)
    return server
  }
}
