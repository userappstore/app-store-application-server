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
  req.data = { collection, collectionInstalls }
}

async function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.collection, 'collection')
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
  }
  if (req.data.collectionInstalls && req.data.collectionInstalls.length) {
    userAppStore.HTML.renderList(doc, req.data.collectionInstalls, 'removable-item', 'removable-list')
    const noApps = doc.getElementById('no-removable')
    noApps.parentNode.removeChild(noApps)
  } else {
    const appsList = doc.getElementById('removable-list')
    appsList.parentNode.removeChild(appsList)
  }
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  if (!req.body || !req.body.installid) {
    return renderPage(req, res)
  }
  if (!req.data.collectionInstalls || !req.data.collectionInstalls.length) {
    return renderPage(req, res, 'invalid-installid')
  }
  for (const app of req.data.collectionInstalls) {
    if (app.installid !== req.body.installid) {
      continue
    }
    try {
      await global.api.user.userappstore.DeleteCollectionItem.delete(req)
      req.data.collectionInstalls.splice(req.data.collectionInstalls.indexOf(app), 1)
      return renderPage(req, res, 'success')
    } catch (error) {
      return renderPage(req, res, error.message)
    }
  }
  return renderPage(req, res, 'invalid-installid')
}
