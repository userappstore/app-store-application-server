const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest(req) {
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  const total = await dashboardServer.get(`/api/user/organizations/organizations-count?accountid=${req.account.accountid}`, req.account.accountid, req.session.sessionid)
  const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
  const organizations = await dashboardServer.get(`/api/user/organizations/organizations?accountid=${req.account.accountid}&offset=${offset}`, req.account.accountid, req.session.sessionid)
  req.data = { organizations, total, offset }
}

async function renderPage(req, res) {
  const doc = userAppStore.HTML.parse(req.route.html)
  if (req.data.organizations && req.data.organizations.length) {
    userAppStore.HTML.renderTable(doc, req.data.organizations, 'organization-row', 'organizations-table')
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      userAppStore.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    const noOrganizations = doc.getElementById('no-organizations')
    noOrganizations.parentNode.removeChild(noOrganizations)
  } else {
    const organizationsTable = doc.getElementById('organizations-table')
    organizationsTable.parentNode.removeChild(organizationsTable)
  }
  return res.end(doc.toString())
}
