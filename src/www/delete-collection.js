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
  if (collection.accountid !== req.account.accountid) {
    throw new Error('invalid-account')
  }
  req.data = { collection }
}

async function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.collection, 'collection')
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, req.data.collection, messageTemplate, 'message-container')
  }
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  try {
    await global.api.user.userappstore.DeleteCollection.delete(req)
    return renderPage(req, res, 'success')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
