const dashboardServer = require('../../../../dashboard-server.js')
const userAppStore = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.projectid) {
      throw new Error('invalid-projectid')
    }
    const project = await global.api.user.userappstore.Project.get(req)
    if (!project) {
      throw new Error('invalid-projectid')
    }
    if (project.shared) {
      throw new Error('invalid-project')
    }
    if (req.body && req.body.organizationid) {
      const membership = await dashboardServer.get(`/api/user/organizations/organization-membership?organizationid=${req.body.organizationid}`, req.account.accountid, req.session.sessionid)
      if (!membership) {
        throw new Error('invalid-organization')
      }
    }
    project.shared = userAppStore.Timestamp.now
    if (!project.serverid) {
      req.body = req.body || {}
      req.body.projectid = req.query.projectid
      req.query.accountid = req.account.accountid
      const server = await global.api.user.userappstore.CreateApplicationServer.post(req)
      project.serverid = server.serverid
     }
    await userAppStore.Storage.write(`project/${req.query.projectid}`, project)
    req.success = true
    return project
  }
}
