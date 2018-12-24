const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  const total = await dashboardServer.get(`/api/user/subscriptions/customers-count?accountid=${req.account.accountid}`, req.account.accountid, req.session.sessionid)
  const offset = req.query ? parseInt(req.query.offset, 10) || 0 : 0
  const customers = await dashboardServer.get(`/api/user/subscriptions/customers?accountid=${req.account.accountid}&offset=${offset}`, req.account.accountid, req.session.sessionid)
  req.data = { customers, total, offset }
}

async function renderPage (req, res) {
  const doc = userAppStore.HTML.parse(req.route.html)
  if (req.data.customers && req.data.customers.length) {
    userAppStore.HTML.renderTable(doc, req.data.customers, 'customer-row', 'customers-table')
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      userAppStore.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    const noCustomers = doc.getElementById('no-customers')
    noCustomers.parentNode.removeChild(noCustomers)
  } else {
    const customersTable = doc.getElementById('customers-table')
    customersTable.parentNode.removeChild(customersTable)
  }
  return res.end(doc.toString())
}
