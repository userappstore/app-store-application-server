const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.collectionid) {
    throw new Error('invalid-collectionid')
  }
  const collection = await global.api.user.userappstore.Collection.get(req)
  if (collection.accountid !== req.account.accountid) {
    throw new Error('invalid-account')
  }
  const total = await global.api.user.userappstore.CollectionInstallsCount.get(req)
  const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
  const installs = await global.api.user.userappstore.CollectionInstalls.get(req)
  req.data = { collection, installs, total, offset }
}

async function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.collection, 'collection')
  if (req.data.installs && req.data.installs.length) {
    userAppStore.HTML.renderTable(doc, req.data.installs, 'install-row', 'installs-table')
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      userAppStore.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    const noInstalls = doc.getElementById('no-installs')
    noInstalls.parentNode.removeChild(noInstalls)
  } else {
    const installsList = doc.getElementById('installs-table')
    installsList.parentNode.removeChild(installsList)
  }
  return res.end(doc.toString())
}
