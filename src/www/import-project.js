const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  const collections = await global.api.user.userappstore.Collections.get(req)
  req.data = { collections }
}

async function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html)
  const input = doc.getElementById('projectid')
  if (req.method === 'GET' && req.query && req.query.projectid) {
    input.setAttribute('value', req.query.projectid || '')
  } else if (req.method === 'POST') {
    input.setAttribute('value', req.body.projectid || '')
  }
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      const form = doc.getElementById('submit-form')
      form.parentNode.removeChild(form)
      return res.end(doc.toString())
    }
  }
  if (req.data.collections && req.data.collections.length) {
    userAppStore.HTML.renderList(doc, req.data.collections, 'collection-option', 'collectionid')
  } else {
    const collectionContainer = doc.getElementById('collection-container')
    collectionContainer.parentNode.removeChild(collectionContainer)
  }
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (!req.body.projectid || !req.body.projectid.length) {
    return renderPage(req, res, 'invalid-projectid')
  }
  if (!req.body.text || !req.body.text.length) {
    return renderPage(req, res, 'invalid-text')
  }
  req.query = req.query || {}
  req.query.projectid = req.body.projectid
  try {
    await global.api.user.userappstore.SharedProject.get(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  try {
    req.query = req.query || {}
    req.query.accountid = req.account.accountid
    await global.api.user.userappstore.CreateInstall.post(req)
    return renderPage(req, res, 'success')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
