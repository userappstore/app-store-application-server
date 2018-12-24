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
  req.query.accountid = req.account.accountid
  const total = await global.api.user.userappstore.InstallsCount.get(req)
  req.query.all = true
  const installs = await global.api.user.userappstore.Installs.get(req)
  if (installs && installs.length && collectionInstalls && collectionInstalls.length) {
    const usedIndex = {}
    for (const install of collectionInstalls) {
      usedIndex[install.installid] = true
    }
    for (const install of installs) {
      if (usedIndex[install.installid]) {
        installs.splice(installs.indexOf(install), 1)
      }
    }
  }
  const offset = req.query ? parseInt(req.query.offset, 10) || 0 : 0
  req.data = { installs, collection, collectionInstalls, total, offset }
}

async function renderPage(req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.collection, 'collection')
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
  }
  if (req.data.installs && req.data.installs.length) {
    userAppStore.HTML.renderList(doc, req.data.installs, 'addable-item', 'addable-list')
    const noApps = doc.getElementById('no-addable')
    noApps.parentNode.removeChild(noApps)
  } else {
    const appsList = doc.getElementById('addable-list')
    appsList.parentNode.removeChild(appsList)
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
  if (!req.data.installs || !req.data.installs.length) {
    return renderPage(req, res, 'invalid-installid')
  }
  for (const install of req.data.installs) {
    if (install.installid !== req.body.installid) {
      continue
    }
    try {
      await global.api.user.userappstore.AddCollectionItem.post(req)
      req.data.collectionInstalls = req.data.collectionInstalls || []
      req.data.collectionInstalls.unshift(install)
      req.data.installs.splice(req.data.installs.indexOf(install), 1)
      return renderPage(req, res, 'success')
    } catch (error) {
      return renderPage(req, res, error.message)
    }
  }
  return renderPage(req, res, 'invalid-installid')
}
