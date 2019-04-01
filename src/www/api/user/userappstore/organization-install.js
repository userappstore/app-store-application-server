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
    const membership = await dashboardServer.get(`/api/user/organizations/organization-membership?organizationid=${install.organizationid}`, req.account.accountid, req.session.sessionid)
    if (!membership) {
      throw new Error('invalid-install')
    }
    return install
  }
}
