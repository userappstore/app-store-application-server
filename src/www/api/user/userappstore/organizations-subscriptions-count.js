const dashboardServer = require('../../../../dashboard-server.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    if (req.query.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    return dashboardServer.get(`/api/application-server/organizations-subscriptions-count?accountid=${req.query.accountid}`, req.account.accountid, req.session.sessionid)
  }
}
