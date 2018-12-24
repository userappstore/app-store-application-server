const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  const total = await global.api.user.userappstore.AppsCount.get(req)
  const apps = await global.api.user.userappstore.Apps.get(req)
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
    for (const app of req.data.apps) {
      if (!app.published) {
        const published = doc.getElementById(`published-${app.appid}`)
        published.parentNode.removeChild(published)
        const unpublished = doc.getElementById(`unpublished-${app.appid}`)
        unpublished.parentNode.removeChild(unpublished)
      } else if (!app.unpublished) {
        const draft = doc.getElementById(`draft-${app.appid}`)
        draft.parentNode.removeChild(draft)
        const unpublished = doc.getElementById(`unpublished-${app.appid}`)
        unpublished.parentNode.removeChild(unpublished)
      } else {
        const draft = doc.getElementById(`draft-${app.appid}`)
        draft.parentNode.removeChild(draft)
        const published = doc.getElementById(`published-${app.appid}`)
        published.parentNode.removeChild(published)
      }
    }
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
