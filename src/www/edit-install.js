const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.installid) {
    throw new Error('invalid-installid')
  }
  const install = await global.api.user.userappstore.Install.get(req)
  if (!install) {
    throw new Error('invalid-installid')
  }
  req.query.accountid = req.account.accountid
  const collections = await global.api.user.userappstore.Collections.get(req)
  req.data = { install, collections }
}

async function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.install, 'install')
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
  }
  const textField = doc.getElementById('text')
  if (req.method === 'GET') {
    textField.setAttribute('value', req.data.install.text)
  } else {
    textField.setAttribute('value', req.body.text || '')
  }
  if (req.data.collections && req.data.collections.length) {
    userAppStore.HTML.renderList(req.data.collections, 'collection-option', 'collectionid')
    if (req.method === 'GET') {
      userAppStore.HTML.setSelectedOptionByValue(doc, 'collectionid', req.data.install.collectionid || '')
    } else {
      userAppStore.HTML.setSelectedOptionByValue(doc, 'collectionid', req.body.collectionid || '')
    }
  }
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (!req.body.text || !req.body.text.length) {
    return renderPage(req, res, 'invalid-text')
  }
  if (req.body.collectionid) {
    let found = false
    if (req.data.collections && req.data.collections.length) {
      for (const collection of req.data.collections) {
        found = collection.collectionid === req.body.collectionid
        if (found) {
          break
        }
      }
    }
    if (!found) {
      return renderPage(req, res, 'invalid-collectionid')
    }
  }
  try {
    await global.api.user.userappstore.UpdateInstall.patch(req)
    return renderPage(req, res, 'success')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
