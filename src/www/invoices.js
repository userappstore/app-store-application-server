const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest(req) {
  const total = await dashboardServer.get(`/api/user/subscriptions/invoices-count?accountid=${req.account.accountid}`, req.account.accountid, req.session.sessionid)
  const offset = req.query && req.query.offset ? parseInt(req.query.offset, 10) : 0
  const invoices = await dashboardServer.get(`/api/user/subscriptions/invoices?accountid=${req.account.accountid}&offset=${offset}`, req.account.accountid, req.session.sessionid)
  req.data = { invoices, total, offset }
}

async function renderPage(req, res) {
  const doc = userAppStore.HTML.parse(req.route.html)
  if (req.data.invoices && req.data.invoices.length) {
    userAppStore.HTML.renderTable(doc, req.data.invoices, 'invoice-row', 'invoices-table')
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      userAppStore.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    const noInvoices = doc.getElementById('no-invoices')
    noInvoices.parentNode.removeChild(noInvoices)
  } else {
    const invoicesTable = doc.getElementById('invoices-table')
    invoicesTable.parentNode.removeChild(invoicesTable)
  }
  return res.end(doc.toString())
}
