const bcrypt = require('../bcrypt.js')
const userAppStore = require('../../index.js')
const exampleToken = bcrypt.hashSync(new Date().toUTCString(), bcrypt.genSaltSync(4))

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.serverid) {
    throw new Error('invalid-serverid')
  }
  const server = await global.api.user.userappstore.ApplicationServer.get(req)
  if (!server) {
    throw new Error('invalid-serverid')
  }
  req.data = { server }
}

async function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.server, 'server')
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      userAppStore.HTML.renderTemplate(doc, req.data.server, 'token-usage', 'message-container')
      const form = doc.getElementById('submit-form')
      form.parentNode.removeChild(form)
      return res.end(doc.toString())
    }
  }
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  try {
    req.data.server = await global.api.user.userappstore.SetApplicationServerToken.patch(req)
    req.data.server.dashboardServer = process.env.DASHBOARD_SERVER
    req.data.server.dashboardServerToken = exampleToken
    if (req.success) {
      return renderPage(req, res, 'success')
    }
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
