const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.stripeid) {
    throw new Error('invalid-stripeid')
  }
  const stripeAccount = await dashboardServer.get(`/api/user/userappstore/publisher?stripeid=${req.query.stripeid}`, req.account.accountid, req.session.sessionid)
  if (!stripeAccount) {
    throw new Error('invalid-stripeid')
  }
  if (!stripeAccount.payouts_enabled) {
    throw new Error('invalid-stripe-account')
  }
  req.data = { stripeAccount }
}

async function renderPage (req, res) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.stripeAccount, 'account')
  if (req.data.stripeAccount.legal_entity.type === 'individual') {
    const company = doc.getElementById('company')
    company.parentNode.removeChild(company)
  } else {
    const individual = doc.getElementById('individual')
    individual.parentNode.removeChild(individual)
  }
  return res.end(doc.toString())
}
