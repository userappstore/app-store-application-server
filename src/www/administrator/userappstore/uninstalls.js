const userAppStore = require('../../../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest(req) {
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  const total = await global.api.user.userappstore.UninstallsCount.get(req)
  const uninstalls = await global.api.user.userappstore.Uninstalls.get(req)
  if (uninstalls && uninstalls.length) {
    for (const uninstall of uninstalls) {
      uninstall.created = userAppStore.Timestamp.date(uninstall.created)
    }
  }
  const offset = req.query ? parseInt(req.query.offset, 10) || 0 : 0
  req.data = { uninstalls, total, offset }
}

async function renderPage(req, res) {
  const doc = userAppStore.HTML.parse(req.route.html)
  if (req.data.uninstalls && req.data.uninstalls.length) {
    userAppStore.HTML.renderTable(doc, req.data.uninstalls, 'uninstall-row', 'uninstalls-table')
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      userAppStore.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    const noUninstalls = doc.getElementById('no-uninstalls')
    noUninstalls.parentNode.removeChild(noUninstalls)
  } else {
    const uninstallsTable = doc.getElementById('uninstalls-table')
    uninstallsTable.parentNode.removeChild(uninstallsTable)
  }
  return res.end(doc.toString())
}
