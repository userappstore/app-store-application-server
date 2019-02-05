const dashboardServer = require('../../../../dashboard-server.js')
const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.installid) {
      throw new Error('invalid-installid')
    }
    let install = await userAppStore.Storage.read(`install/${req.query.installid}`)
    if (!install || !install.length) {
      throw new Error('invalid-installid')
    }
    install = JSON.parse(install)
    if (!install.organizationid) {
      throw new Error('invalid-install')
    }
    const memberships = await dashboardServer.get(`/api/user/organizations/memberships?accountid=${req.account.accountid}&all=true`, req.account.accountid, req.session.sessionid)
    if (!memberships || !memberships.length) {
      throw new Error('invalid-install')
    }
    let membership
    for (const item of memberships) {
      if (install.subscriptions.indexOf(item.membershipid) === -1) {
        continue
      }
      membership = item
      break
    }
    if (!membership) {
      throw new Error('invalid-install')
    }
    return install
  }
}
