const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.appid) {
    throw new Error('invalid-appid')
  }
  const app = await global.api.user.userappstore.App.get(req)
  if (!app) {
    throw new Error('invalid-appid')
  }
  if (!app.published || app.unpublished) {
    throw new Error('invalid-app')
  }
  req.data = { app }
}

async function renderPage (req, res, messageTemplate) {
  if (req.error) {
    messageTemplate = req.error
  }
  messageTemplate = messageTemplate || 'note'
  const doc = userAppStore.HTML.parse(req.route.html, req.data.app, 'app')
  userAppStore.HTML.renderTemplate(doc, req.data.app, messageTemplate, 'message-container')
  if (req.error || messageTemplate === 'success') {
    const submitForm = doc.getElementById('submit-form')
    submitForm.parentNode.removeChild(submitForm)
  }
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  try {
    await global.api.user.userappstore.SetAppUnpublished.patch(req)
    return renderPage(req, res, 'success')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
