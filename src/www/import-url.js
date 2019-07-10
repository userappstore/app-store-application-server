const userAppStore = require('../../index.js')

module.exports = {
  get: renderPage,
  post: submitForm
}

async function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html)
  if (req.body) {
    const input = doc.getElementById('url')
    input.setAttribute('value', req.body.url || '')
  }
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      const form = doc.getElementById('submit-form')
      form.parentNode.removeChild(form)
    }
  }
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (!req.body.url || !req.body.url.length || !req.body.url.startsWith('https://')) {
    return renderPage(req, res, 'invalid-url')
  }
  if (req.body.url.length > 200) {
    return renderPage(req, res, 'invalid-url-length')
  }
  if (req.body['application-server'] === 'iframe') {
    req.query = req.query || {}
    req.query.accountid = req.account.accountid
    try {
      await global.api.user.userappstore.CreateInstall.post(req)
      return renderPage(req, res, 'success')
    } catch (error) {
      return renderPage(req, res, error.message)
    }
  }
  let server
  try {
    req.query.url = req.body.url
    server = await global.api.user.userappstore.UrlApplicationServer.get(req)
  } catch (error) {
  }
  if (!server) {
    req.query.accountid = req.account.accountid
    server = await global.api.user.userappstore.CreateApplicationServer.post(req)
  }
  try {
    res.statusCode = 302
    res.setHeader('location', `/confirm-import?serverid=${server.serverid}`)
    return res.end()
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
