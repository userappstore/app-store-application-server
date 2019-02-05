const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    if (req.query.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    let serverids
    if (req.query.all) {
      serverids = await userAppStore.StorageList.listAll(`account/servers/${req.query.accountid}`)
    } else {
      serverids = await userAppStore.StorageList.list(`account/servers/${req.query.accountid}`)
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      serverids = await userAppStore.StorageList.list(`account/servers/${req.query.accountid}`, offset)
    }
    if (!serverids || !serverids.length) {
      return null
    }
    const servers = []
    for (const serverid of serverids) {
      req.query.serverid = serverid
      const server = await global.api.user.userappstore.ApplicationServer.get(req)
      servers.push(server)
    }
    return servers
  }
}
