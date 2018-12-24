const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  const total = await global.api.user.userappstore.UnpublishedAppsCount.get(req)
  const apps = await global.api.user.userappstore.UnpublishedApps.get(req)
  if (apps && apps.length) {
    for (const app of apps) {
      app.created = userAppStore.Timestamp.date(app.created)
    }
  }
  const offset = req.query ? parseInt(req.query.offset, 10) || 0 : 0
  req.data = { apps, total, offset }
}

async function renderPage (req, res) {
  const doc = userAppStore.HTML.parse(req.route.html)
  if (req.data.apps && req.data.apps.length) {
    userAppStore.HTML.renderTable(doc, req.data.apps, 'app-row', 'apps-table')
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      userAppStore.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    const noApps = doc.getElementById('no-apps')
    noApps.parentNode.removeChild(noApps)
  } else {
    const appsTable = doc.getElementById('apps-table')
    appsTable.parentNode.removeChild(appsTable)
  }
  return res.end(doc.toString())
}
