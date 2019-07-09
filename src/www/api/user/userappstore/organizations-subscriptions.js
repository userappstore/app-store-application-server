const dashboardServer = require('../../../../dashboard-server.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    if (req.query.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    let subscriptions
    if (req.query.all) {
      subscriptions = await dashboardServer.get(`/api/application-server/organizations-subscriptions?accountid=${req.query.accountid}&all=true`, req.account.accountid, req.session.sessionid)
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      subscriptions = await dashboardServer.get(`/api/application-server/organizations-subscriptions?accountid=${req.query.accountid}&offset=${offset}`, req.account.accountid, req.session.sessionid)
    }
    if (!subscriptions || !subscriptions.length) {
      return null
    }
    return subscriptions
  }
}
