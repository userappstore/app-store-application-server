const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.installid) {
    throw new Error('invalid-installid')
  }
  const install = await global.api.user.userappstore.Install.get(req)
  if (!install.appid) {
    throw new Error('invalid-install')
  }
  const plan = await dashboardServer.get(`/api/user/${install.appid}/subscriptions/published-plan?planid=${install.planid}`, req.account.accountid, req.session.sessionid)
  let organization, memberships
  if (install.organizationid) {
    organization = await dashboardServer.get(`/api/user/organizations/organization?organizationid=${install.organizationid}`, req.account.accountid, req.session.sessionid)
    memberships = await dashboardServer.get(`/api/user/organizations/organization-memberships?organizationid=${install.organizationid}`, req.account.accountid, req.session.sessionid)
  }
  req.data = { install, plan, organization, memberships }
}

function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.install, 'install')
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, {}, messageTemplate, 'message-container')
  }
  // plan information
  const quantity = 1 + (req.data.install.subscriptions ? req.data.install.subscriptions.length : 0)
  const planInfo = {
    object: 'plan',
    name: req.data.plan.id,
    quantity,
    interval: req.data.plan.interval,
    price: req.data.plan.amount,
    total: quantity * req.data.plan.amount
  }
  userAppStore.HTML.renderTemplate(doc, planInfo, 'plan-row', 'plan-table')
  // charge information
  const chargeInfo = {
    object: 'charge',
    trial: req.data.plan.trial_free_days,
    amount: quantity * req.data.plan.amount,
    interval: req.data.plan.interval
  }
  const charge = doc.getElementById('charge')
  if (req.data.plan.trial_free_days) {
    userAppStore.HTML.renderTemplate(doc, chargeInfo, 'charge-later', charge)
  } else {
    userAppStore.HTML.renderTemplate(doc, chargeInfo, 'charge-now', charge)
  }
  // organization members
  if (req.data.install.subscriptions) {
    const emails = []
    for (const membership of req.data.memberships) {
      if (req.data.install.subscriptions.indexOf(membership.membershipid) > -1) {
        emails.push({
          object: 'item',
          accountid: membership.accountid,
          email: membership.email
        })
      }
    }
    if (emails && emails.length) {
      userAppStore.HTML.renderTable(doc, emails, 'subscription-row', 'subscriptions-table')
    }
  } else {
    const subscriptions = doc.getElementById('subscriptions-table')
    subscriptions.parentNode.removeChild(subscriptions)
  }
  return res.end(doc.toString())
}
