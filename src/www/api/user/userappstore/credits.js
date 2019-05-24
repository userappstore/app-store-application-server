const dashboardServer = require('../../../../dashboard-server.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    if (req.query.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    let credits
    if (req.query.all) {
      credits = await dashboardServer.get(`/api/application-server/credits?accountid=${req.query.accountid}&all=true`, req.account.accountid, req.session.sessionid)
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      credits = await dashboardServer.get(`/api/application-server/credits?accountid=${req.query.accountid}&offset=${offset}`, req.account.accountid, req.session.sessionid)
    }
    if (!credits || !credits.length) {
      return null
    }
    return credits
  }
}
