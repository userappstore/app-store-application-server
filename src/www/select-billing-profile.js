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
  const plan = await dashboardServer.get(`/api/user/${install.appid}/subscriptions/published-plan?planid=${install.planid}`, req.account.accountid, req.session.sessionid)
  const customers = await dashboardServer.get(`/api/user/subscriptions/customers?accountid=${req.account.accountid}`, req.account.accountid, req.session.sessionid)
  req.data = { customers, install, plan }
}

async function renderPage(req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.install, 'install')
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, null, messageTemplate, `message-container`)
  }
  if (req.data.customers && req.data.customers.length) {
    userAppStore.HTML.renderList(doc, req.data.customers, 'customer-option', 'customerid')
  } else {
    res.statusCode = 302
    res.setHeader('location', `/account/subscriptions/create-billing-profile?returnURL=${req.urlPath}?installid=${req.query.installid}`)
    return res.end()
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
    await global.api.user.userappstore.CreateInstallSubscription.post(req)
    res.statusCode = 302
    res.setHeader('location', `/install/${req.query.installid}/home`)
    return res.end()
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
