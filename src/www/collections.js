const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  const total = await global.api.user.userappstore.CollectionsCount.get(req)
  const collections = await global.api.user.userappstore.Collections.get(req)
  if (collections && collections.length) {
    for (const collection of collections) {
      collection.created = userAppStore.Timestamp.date(collection.created)
    }
  }
  const offset = req.query ? parseInt(req.query.offset, 10) || 0 : 0
  req.data = { collections, total, offset }
}

async function renderPage(req, res) {
  const doc = userAppStore.HTML.parse(req.route.html)
  if (req.data.collections && req.data.collections.length) {
    userAppStore.HTML.renderTable(doc, req.data.collections, 'collection-row', 'collections-table')
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      userAppStore.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    const noCollections = doc.getElementById('no-collections')
    noCollections.parentNode.removeChild(noCollections)
  } else {
    const collectionsTable = doc.getElementById('collections-table')
    collectionsTable.parentNode.removeChild(collectionsTable)
  }
    
  return res.end(doc.toString())
}
