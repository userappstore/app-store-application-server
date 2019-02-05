const dashboardServer = require('../../../../dashboard-server.js')
const userAppStore = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.serverid) {
      throw new Error('invalid-application-serverid')
    }
    if (!req.body || !req.body.organizationid) {
      throw new Error('invalid-organizationid')
    }
    const organization = await dashboardServer.get(`/api/user/organizations/organization?organizationid=${req.body.organizationid}`, req.account.accountid, req.session.sessionid)
    if (!organization) {
      throw new Error('invalid-organizationid')
    }
    const server = await global.api.user.userappstore.ApplicationServer.get(req)
    if (!server) {
      throw new Error('invalid-server')
    }
    if (server.ownerid !== req.account.accountid) {
      if (server.projectid) {
        req.query.projectid = server.projectid
        const project = await global.api.user.userappstore.Project.get(req)
        if (project.accountid !== req.account.accountid) {
          throw new Error('invalid-account')
        }
      } else {
      throw new Error('invalid-account')
      }
    }
    server.organizationid = req.body.organizationid
    await userAppStore.Storage.write(`server/${server.serverid}`, server)
    await userAppStore.StorageList.add(`organization/servers/${req.body.organizationid}`, server.serverid)
    req.success = true
    return server
  }
}
