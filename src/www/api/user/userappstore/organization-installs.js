const dashboardServer = require('../../../../dashboard-server.js')
const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    if (req.query.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    const memberships = await dashboardServer.get(`/api/user/organizations/memberships?accountid=${req.query.accountid}&all=true`, req.account.accountid, req.session.sessionid)
    if (!memberships || !memberships.length) {
      return null
    }
    const membershipids = []
    for (const membership of memberships) {
      membershipids.push(membership.membershipid)
    }
    const installs = []
    for (const membership of memberships) {
      const installids = await userAppStore.StorageList.listAll(`organization/installs/${membership.organizationid}`)
      if (!installids || !installids.length) {
        continue
      }
      for (const installid of installids) {
        req.query.installid = installid
        const install = await global.api.user.userappstore.OrganizationInstall.get(req)
        installs.push(install)
      }
    }
    if (!installs || !installs.length) {
      return null
    }
    return installs
  }
}
