const userAppStore = require('../../../../../index.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.serverid) {
      throw new Error('invalid-application-serverid')
    }
    const server = await global.api.user.userappstore.ApplicationServer.get(req)
    if (server.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    await userAppStore.Storage.deleteFile(`server/${req.query.serverid}`)
    await userAppStore.StorageList.remove(`servers`, req.query.serverid)
    await userAppStore.StorageList.remove(`account/servers/${req.account.accountid}`, req.query.serverid)
    if (server.url) {
      const urlWithoutProtocol = server.url.substring('https://'.length)
      const domain = urlWithoutProtocol.split('/')[0]
      if (domain === global.domain) {
        throw new Error('invalid-domain')
      }
      await userAppStore.Storage.deleteFile(`map/servers/domain`, domain)
    } else {
      await userAppStore.Storage.deleteFile(`map/servers/projectid`, req.body.projectid)
    }
    req.success = true
    return unserver
  }
}
