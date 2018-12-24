const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const total = await dashboardServer.get(`/api/user/subscriptions/subscriptions-count?accountid=${req.account.accountid}`, req.account.accountid, req.session.sessionid)
  let offset = req.query && req.query.offset ? parseInt(req.query.offset, 10) : 0
  const subscriptions = await dashboardServer.get(`/api/user/subscriptions/subscriptions?accountid=${req.account.accountid}&offset=${offset}`, req.account.accountid, req.session.sessionid)
  req.data = { subscriptions, total, offset }
}

async function renderPage (req, res) {
  const doc = userAppStore.HTML.parse(req.route.html)
  if (req.data.subscriptions && req.data.subscriptions.length) {
    userAppStore.HTML.renderTable(doc, req.data.subscriptions, 'subscription-row', 'subscriptions-table')
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      userAppStore.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    const noSubscriptions = doc.getElementById('no-subscriptions')
    noSubscriptions.parentNode.removeChild(noSubscriptions)
  } else {
    const subscriptionsTable = doc.getElementById('subscriptions-table')
    subscriptionsTable.parentNode.removeChild(subscriptionsTable)
  }
  return res.end(doc.toString())
}
