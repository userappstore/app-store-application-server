const userAppStore = require('../../index.js')

module.exports = {
  get: renderPage,
  post: submitForm
}

async function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html)
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, req.data ? req.data.project : null, messageTemplate, 'message-container')
  }
  req.body = req.body || {}
  const idFIeld = doc.getElementById('projectid')
  idFIeld.setAttribute('value', req.body.projectid || userAppStore.UUID.friendly())
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  if (!req.body.projectid || !req.body.projectid.length || !req.body.projectid.match(/[a-zA-Z0-9]+/)) {
    return renderPage(req, res, 'invalid-projectid')
  }
  try {
    req.query = {accountid: req.account.accountid}
    const project = await global.api.user.userappstore.CreateProject.post(req)
    res.statusCode = 302
    res.setHeader('location', `/project?projectid=${project.projectid}`)
    return res.end()
  } catch (error) {
    if (error.message.startsWith('invalid-') || error.message.startsWith('duplicate-')) {
      return renderPage(req, res, error.message)
    }
    return renderPage(req, res, error.message)
  }
}
