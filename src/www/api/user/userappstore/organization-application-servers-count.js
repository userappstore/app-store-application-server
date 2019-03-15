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
    return userAppStore.StorageList.count(`organization/servers/${req.query.organizationid}`)
  }
}
