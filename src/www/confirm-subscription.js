const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.installid) {
    throw new Error('invalid-installid')
  }
  const install = await global.api.user.userappstore.Install.get(req)
  if (!install.appid) {
    throw new Error('invalid-install')
  }
  const customers = await dashboardServer.get(`/api/user/subscriptions/customers?accountid=${req.account.accountid}`, req.account.accountid, req.session.sessionid)
  const elgibleCustomers = []
  if (customers && customers.length) {
    for (const customer of customers) {
      if (!customer.default_source) {
        continue
      }
      elgibleCustomers.push(customer)
      for (const card of customer.sources.data) {
        if (card.id === customer.default_source) {
          customer.defaultSource = card
        }
      }
    }
  }
  let organization, memberships
  if (install.organizationid) {
    organization = await dashboardServer.get(`/api/user/organizations/organization?organizationid=${install.organizationid}`, req.account.accountid, req.session.sessionid)
    memberships = await dashboardServer.get(`/api/user/organizations/organization-memberships?organizationid=${install.organizationid}`, req.account.accountid, req.session.sessionid)
  }
  req.query.serverid = install.serverid
  const server = await global.api.user.userappstore.ApplicationServer.get(req)
  const plan = await dashboardServer.get(`/api/user/subscriptions/published-plan?planid=${install.planid}`, null, null, server.applicationServer, server.applicationServerToken)
  const quantity = 1 + (install.subscriptions ? install.subscriptions.length : 0)
  switch (plan.currency) {
    case 'usd':
      plan.amountFormatted = `$${plan.amount * quantity / 100}`
      break
    default:
      plan.amountFormatted = plan.amount * quantity
      break
  }
  req.data = { quantity, install, plan, organization, memberships, customers: elgibleCustomers }
}

function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.install, 'install')
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, {}, messageTemplate, 'message-container')
  }
  // plan information
  userAppStore.HTML.renderTemplate(doc, req.data.plan, 'plan-row', 'plan-table')
  if (req.data.plan.trial_free_days) {
    userAppStore.HTML.renderTemplate(doc, req.data.plan, 'charge-later', 'charge')
  } else {
    userAppStore.HTML.renderTemplate(doc, req.data.plan, 'charge-now', 'charge')
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
  // billing profiles
  if (req.data.customers && req.data.customers.length) {
    userAppStore.HTML.renderList(doc, req.data.customers, 'customer-option', 'customerid')
  } else {
    const existingContainer = doc.getElementById('existing-container')
    existingContainer.parentNode.removeChild(existingContainer)
  }
  return res.end(doc.toString())
}

async function submitForm(req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (!req.body.customerid || !req.data.customers || !req.data.customers.length) {
    return renderPage(req, res, 'invalid-customerid')
  }
  let found = false
  for (const customer of req.data.customers) {
    found = customer.id === req.body.customerid
    if (found) {
      if (req.data.plan.amount && !customer.default_source) {
        return renderPage(req, res, 'invalid-source')
      }
      break
    }
  }
  if (!found) {
    return renderPage(req, res, 'invalid-customerid')
  }
  try {
    const thing = await global.api.user.userappstore.CreateInstallSubscription.post(req)
    res.statusCode = 302
    res.setHeader('location', `/install/${req.query.installid}/home`)
    return res.end()
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
