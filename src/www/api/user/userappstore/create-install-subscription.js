const dashboardServer = require('../../../../dashboard-server.js')
const userAppStore = require('../../../../../index.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.installid) {
      throw new Error('invalid-installid')
    }
    if (!req.body || !req.body.customerid) {
      throw new Error('invalid-customerid')
    }
    let install
    try {
      install = await global.api.user.userappstore.Install.get(req)
    } catch (error) {
    }
    if (!install) {
      try {
        install = await global.api.user.userappstore.OrganizationInstall.get(req)
        // make a copy for ourselves
        req.query.accountid = req.account.accountid
        const bodyWas = req.body
        req.body = {
          text: 'installed-app-name',
          appid: install.appid
        }
        install = await global.api.user.userappstore.CreateInstall.post(req)
        req.body = bodyWas
        req.query.installid = install.installid
      } catch (error) {
      }
    }
    if (!install) {
      throw new Error('invalid-installid')
    }
    if (!install.appid || install.subscriptionid) {
      throw new Error('invalid-install')
    }
    if (!install.planid) {
      throw new Error('invalid-plan')
    }
    req.query.appid = install.appid
    const app = await global.api.user.userappstore.PublishedApp.get(req)
    req.query.serverid = install.serverid
    const server = await global.api.user.userappstore.ApplicationServer.get(req)
    const plan = await dashboardServer.get(`/api/user/subscriptions/published-plan?planid=${install.planid}`, null, null, server.applicationServer, server.applicationServerToken)
    const customer = await dashboardServer.get(`/api/user/subscriptions/customer?customerid=${req.body.customerid}`, req.account.accountid, req.session.sessionid)
    if (plan.amount && !customer.default_source) {
      throw new Error('invalid-customerid')
  }
    let defaultSource
    for (const source of customer.sources.data) {
      if (source.id === customer.default_source) {
        defaultSource = source
        break
      }
    }
    const nameParts = defaultSource.name.split(' ')
    const firstName = nameParts.shift()
    const otherNames = nameParts.join(' ')
    req.body = {
      email: customer.email,
      ['first-name']: firstName,
      ['last-name']: otherNames
    }
    const account = await global.api.user.userappstore.CreateInstallAccount.post(req)
    if (!account) {
      throw new Error('invalid-account')
    }
    // create customer profile
    const installCustomer = await dashboardServer.post(`/api/application-server/copy-customer?customerid=${customer.id}`, { installid: install.installid, accountid: account.accountid }, req.account.accountid, req.session.sessionid)
    const subscription = await dashboardServer.post(`/api/application-server/create-subscription?customerid=${installCustomer.id}`, { installid: install.installid, accountid: account.accountid }, req.account.accountid, req.session.sessionid)
    if(!subscription) {
      throw new Error('invalid-subscription')
    }
    install.accountidSignedIn = account.accountid
    install.stripeid = app.stripeid
    install.customerid = installCustomer.id
    install.subscriptionid = subscription.id
    install.configured = userAppStore.Timestamp.now
    install.serverid = app.serverid
    await userAppStore.Storage.write(`install/${req.query.installid}`, install)
    req.success = true
    return install
  }
}
