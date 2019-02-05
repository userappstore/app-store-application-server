const userAppStore = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.serverid) {
      throw new Error('invalid-application-serverid')
    }
    const server = await global.api.user.userappstore.ApplicationServer.get(req)
    if (!server) {
      throw new Error('invalid-application-serverid')
    }
    if (!req.body.projectid && !req.body.url) {
      throw new Error('invalid-source')
    }
    if (req.body.projectid && req.body.url) {
      throw new Error('invalid-source')
    }
    delete (server.projectid)
    delete (server.url)
    // integrating a project
    if (req.body.projectid) {
      server.projectid = req.body.projectid
      req.query.projectid = req.body.projectid
      const project = await global.api.user.userappstore.Project.get(req)
      if (!project) {
        throw new Error('invalid-projectid')
      }
      if (project.serverid) {
        throw new Error('duplicate-server')
      }
    }
    // integrating a URL
    if (req.body.url) {
      if (!req.body.url.startsWith('https://')) {
        throw new Error('invalid-url')
      }
      if (req.body.url.length > 200) {
        throw new Error('invalid-url-length')
      }
      req.query.url = req.body.url
      server.url = req.body.url
      let existing
      try {
        existing = await global.api.user.userappstore.UrlIntegration.get(req)
      } catch (error) {
        if (error.message !== 'invalid-url') {
          throw error
        }
      }
      if (existing) {
        throw new Error('duplicate-server')
      }
    }
    await userAppStore.Storage.write(`server/${serverid}`, server)
    if (req.body.url) {
      const urlWithoutProtocol = req.body.url.substring('https://'.length)
      const domain = urlWithoutProtocol.split('/')[0]
      if (domain === global.domain) {
        throw new Error('invalid-domain')
      }
      await userAppStore.Storage.write(`map/servers/domain`, domain, serverid)
    } else {
      await userAppStore.Storage.write(`map/servers/projectid`, req.body.projectid, serverid)
    }
    await userAppStore.StorageList.add(`servers`, serverid)
    await userAppStore.StorageList.add(`account/servers/${req.query.accountid}`, serverid)
    req.success = true
    return server
  }
}
