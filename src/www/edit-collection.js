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
  req.data = { collection }
}

async function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.collection, 'collection')
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
  }
  const textField = doc.getElementById('text')
  textField.setAttribute('value', req.data.collection.text)
  const backgroundField = doc.getElementById('background')
  backgroundField.setAttribute('value', req.data.collection.background)
  const nameField = doc.getElementById('name')
  nameField.setAttribute('value', req.data.collection.name)
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (!req.body.name || !req.body.name.length) {
    return renderPage(req, res, 'invalid-name')
  }
  if (!req.body.text || !req.body.text.length) {
    return renderPage(req, res, 'invalid-text')
  }
  if (!req.body.background || !req.body.background.length) {
    return renderPage(req, res, 'invalid-background')
  }
  try {
    await global.api.user.userappstore.UpdateCollection.patch(req)
    return renderPage(req, res, 'success')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
