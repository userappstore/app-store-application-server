const dashboardServer = require('../../../../dashboard-server.js')
const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    // note:  on the Dashboard server this request is intercepted and has
    // the administrator route substituted, allowing the application server
    // to access any Stripe account
    const stripeAccount = await dashboardServer.get(`/api/application-server/publisher?stripeid=${req.query.stripeid}`, req.account.accountid, req.session.sessionid)
    const apps = await userAppStore.App.count(stripeAccount.metadata.accountid)
    if (!apps) {
      throw new Error('invalid-stripe-account')
    }
    const publisher = {
      object: 'account',
      id: stripeAccount.id,
      country: stripeAccount.country,
      registered: stripeAccount.created
    }
    publisher.name = `${stripeAccount.legal_entity.first_name} ${stripeAccount.legal_entity.last_name}`
    if (stripeAccount.legal_entity.type === 'business') {
      publisher.business = stripeAccount.legal_entity.business_name
    }
    return publisher
  }
}
