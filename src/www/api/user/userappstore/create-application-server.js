const bcrypt = require('../../../../bcrypt.js')
const dashboardServer = require('../../../../dashboard-server.js')
const userAppStore = require('../../../../../index.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    if (req.query.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    if (!req.body) {
      throw new Error('invalid-source')
    }
    if (!req.body.projectid && !req.body.url) {
      throw new Error('invalid-source')
    }
    if (req.body.projectid && req.body.url) {
      throw new Error('invalid-source')
    }
    let domain
    if (req.body.url) {
      if (!req.body.url || !req.body.url.length || !req.body.url.startsWith('https://')) {
        return renderPage(req, res, 'invalid-url')
      }
      if (req.body.url.length > 200) {
        return renderPage(req, res, 'invalid-url-length')
      }
      domain = req.body.url.substring('https://'.length)
      if (domain === global.domain) {
        throw new Error('invalid-domain')
      }
    }
    let project
    if (req.body.projectid) {
      req.query.projectid = req.body.projectid
      project = await global.api.user.userappstore.Project.get(req)
      if (!project) {
        throw new Error('invalid-projectid')
      }
    }
    let serverid = `server_${userAppStore.UUID.random(16)}`
    let exists = await userAppStore.Storage.exists(`server/${serverid}`)
    if (exists) {
      while (exists) {
        installid = userAppStore.UUID.friendly()
        exists = await userAppStore.Storage.exists(`server/${serverid}`)
      }
    }
    let server = {
      object: 'server',
      serverid: serverid,
      created: userAppStore.Timestamp.now,
    }
    if (req.body.projectid) {
      try {
        req.query.projectid = req.body.projectid
        const existing = await global.api.user.userappstore.ProjectApplicationServer.get(req)
        if (existing) {
          throw new Error('duplicate-server')
        }
      } catch (error) {
      }
      // creating an application server for a project assigns the project 
      // owner as the application server owner
      server.applicationServer = project.projectid
      server.projectid = req.body.projectid
      server.claimed = userAppStore.Timestamp.now
      project.serverid = server.serverid
    } else {
      try {
        req.query.url = req.body.url
        const existing = await global.api.user.userappstore.UrlApplicationServer.get(req)
        if (existing) {
          throw new Error('duplicate-server')
        }
      } catch (error) {
      } 
      // creating an application server for a URL does not assign anyone
      // ownership until the domain is claimed by someone
      server.applicationServer = req.body.url
    }
    // creating an application server with an organization owner
    if (req.body.organizationid) {
      const membership = await dashboardServer.get(`/api/user/organizations/organization-membership?organizationid=${req.body.organizationid}`, req.account.accountid, req.session.sessionid)
      if (!membership) {
        throw new Error('invalid-organization')
      }
      server.organizationid = req.body.organizationid
    }
    server.applicationServerToken = userAppStore.UUID.random(64)
    server.dashboardEncryptionKey = userAppStore.UUID.random(64)
    server.bcryptFixedSaltHash = await bcrypt.genSalt(10)
    server.sessionEncryptionKey = userAppStore.UUID.random(64)
    server.encryptionKey = userAppStore.UUID.random(64)
    await userAppStore.Storage.write(`server/${server.serverid}`, server)
    if (req.body.url) {
      await userAppStore.Storage.write(`map/server/domain/${domain}`, server.serverid)
    } else {
      await userAppStore.Storage.write(`project/${req.body.projectid}`, project)
      await userAppStore.Storage.write(`map/server/projectid/${req.body.projectid}`, server.serverid)
      await userAppStore.StorageList.add(`account/servers/${req.account.accountid}`, server.serverid)
    }
    if (req.body.organizationid) {
      await userAppStore.StorageList.add(`organization/servers/${server.organizationid}`, server.serverid)
    }
    req.success = true
    return server
  }
}
