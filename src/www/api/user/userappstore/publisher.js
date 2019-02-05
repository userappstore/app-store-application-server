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
    const stripeAccount = await dashboardServer.get(`/api/application-server/stripe-account?stripeid=${req.query.stripeid}`, req.account.accountid, req.session.sessionid)
    const apps = await global.api.user.userappstore.PublisherAppsCount.get(req)
    const publisher = {
      object: 'publisher',
      stripeid: stripeAccount.id,
      country: stripeAccount.country,
      registered: stripeAccount.created,
      type: stripeAccount.legal_entity.type,
      apps
    }
    publisher.name = `${stripeAccount.legal_entity.first_name} ${stripeAccount.legal_entity.last_name}`
    if (stripeAccount.legal_entity.type === 'business') {
      publisher.business = stripeAccount.legal_entity.business_name
    }
    return publisher
  }
}
