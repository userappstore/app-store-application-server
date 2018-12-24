const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.collectionid) {
    throw new Error('invalid-collectionid')
  }
  const collection = await global.api.user.userappstore.Collection.get(req)
  if (!collection) {
    throw new Error('invalid-collectionid')
  }
  const collectionInstalls = await global.api.user.userappstore.CollectionInstalls.get(req)
  req.data = {collection, collectionInstalls}
}

async function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.collection, 'collection')
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
  }
  if (req.data.collectionInstalls && req.data.collectionInstalls.length) {
    userAppStore.HTML.renderTable(doc, req.data.collectionInstalls, 'install-row', 'installs-table')
    let index = 1
    for (const install of req.data.collectionInstalls) {
      const position = doc.getElementById(`position-${install.installid}`)
      position.setAttribute('value', req.body ? req.body[`position-${install.installid}`] : index)
      index++
    }
    const noApps = doc.getElementById('no-installs')
    noApps.parentNode.removeChild(noApps)
  } else {
    const installsTable = doc.getElementById('installs-table')
    installsTable.parentNode.removeChild(installsTable)
  }
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  try {
    await global.api.user.userappstore.SetCollectionItemsPosition.patch(req)
    req.data.collection = await global.api.user.userappstore.Collection.get(req)
    req.data.collectionInstalls = await global.api.user.userappstore.CollectionInstalls.get(req)
    return renderPage(req, res, 'success')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
