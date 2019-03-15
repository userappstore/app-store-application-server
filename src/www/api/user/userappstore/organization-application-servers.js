const dashboardServer = require('../../../../dashboard-server.js')
const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.organizationid) {
      throw new Error('invalid-organizationid')
    }
    const organization = await dashboardServer.get(`/api/user/organizations/organization?organizationid=${req.query.organizationid}`, req.account.accountid, req.session.sessionid)
    if (!organization) {
      throw new Error('invalid-organizationid')
    }
    if (organization.ownerid !== req.account.accountid) {
      const membership = await dashboardServer.get(`/api/user/organizations/organization-membership?organizationid=${req.query.organizationid}`, req.account.accountid, req.session.sessionid)
      if (!membership) {
        throw new Error('invalid-account')
      }
    }
    let serverids
    if (req.query.all) {
      serverids = await userAppStore.StorageList.listAll(`organization/servers/${req.query.organizationid}`)
    } else {
      serverids = await userAppStore.StorageList.list(`organization/servers/${req.query.organizationid}`)
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      serverids = await userAppStore.StorageList.list(`organization/servers/${req.query.organizationid}`, offset)
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
