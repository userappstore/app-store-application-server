const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest(req) {
  if (!req.query || !req.query.serverid) {
    throw new Error('invalid-application-serverid')
  }
  const server = await global.api.user.userappstore.ApplicationServer.get(req)
  if (!server) {
    throw new Error('invalid-server')
  }
  req.data = { server }
}

async function renderPage(req, res, messageTemplate) {
  if (req.error) {
    messageTemplate = req.error
  }
  const doc = userAppStore.HTML.parse(req.route.html)
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success' || req.error) {
      const form = doc.getElementById('submit-form')
      form.parentNode.removeChild(form)
      return res.end(doc.toString())
    }
  }
  return res.end(doc.toString())
}

async function submitForm(req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (!req.body.url || !req.body.url.length || !req.body.url.startsWith('https://')) {
    return renderPage(req, res, 'invalid-url')
  }
  if (req.body.url.length > 200) {
    return renderPage(req, res, 'invalid-url-length')
  }
  const urlParts = req.body.split('://')
  if (urlParts[1].index('/') === -1) {
    req.body.home = '/'
  } else {
    const domainParts = urlParts[1].split('/')
    req.body.url = `https://${domainParts.shift()}`
    req.body.home = domainParts.join('/')
  }
  try {
    await global.api.user.userappstore.SetIntegrationOwner.get(req)
    return renderPage(req, res, 'success')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
