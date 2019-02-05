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
  if (install.accountid !== req.account.accountid) {
    throw new Error('invalid-account')
  }
  req.data = { install }
}

async function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.install, 'install')
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, req.data.install, messageTemplate, 'message-container')
  } else {
    userAppStore.HTML.renderTemplate(doc, req.data.install, 'install-information', 'message-container')
  }
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  try {
    await global.api.user.userappstore.DeleteInstall.delete(req)
    res.statusCode = 302
    res.setHeader('location', `/installs`)
    return res.end()
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
