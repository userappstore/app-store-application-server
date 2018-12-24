const dashboardServer = require('../../../../dashboard-server.js')
const userAppStore = require('../../../../../index.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.installid) {
      throw new Error('invalid-install')
    }
    if (!req.body || !req.body.customerid) {
      throw new Error('invalid-customerid')
    }
    const install = await global.api.user.userappstore.Install.get(req)
    if (!install.appid || install.subscriptionid) {
      throw new Error('invalid-install')
    }
    if (!install.planid) {
      throw new Error('invalid-plan')
    }
    const plan = await dashboardServer.get(`/api/user/${install.appid}/subscriptions/published-plan?planid=${install.planid}`, req.account.accountid, req.session.sessionid)
    const customer = await dashboardServer.get(`/api/user/subscriptions/customer?customerid=${req.body.customerid}`, req.account.accountid, req.session.sessionid)
    if (plan.amount && !customer.default_source) {
      throw new Error('invalid-customerid')
    }
    const quantity = install.organizationid && install.subscriptions ? install.subscriptions.length + 1 : 1
    req.body = { quantity }
    let subscription
    try {
      subscription = await dashboardServer.post(`/api/user/${install.appid}/subscriptions/create-subscription?planid=${install.planid}`, req.body, req.account.accountid, req.session.sessionid)
    } catch (error) {
      if (error.message.startsWith('invalid-')) {
        throw error
      }
      throw new Error('unknown-error')
    }
    install.subscriptionid = subscription.id
    await userAppStore.Storage.write(`install/${req.query.installid}`, install)
    req.success = true
    return install
  }
}
