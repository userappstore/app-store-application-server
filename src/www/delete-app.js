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
  if (app.accountid !== req.account.accountid) {
    throw new Error('invalid-account')
  }
  req.data = { app }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = messageTemplate || 'note'
  const doc = userAppStore.HTML.parse(req.route.html, req.data.app, 'app')
  userAppStore.HTML.renderTemplate(doc, req.data.app, messageTemplate, 'message-container')
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  try {
    await global.api.user.userappstore.DeleteApp.delete(req)
    return renderPage(req, res, 'success')
  } catch (error) {
    console.log(error)
    return renderPage(req, res, error.message)
  }
}
