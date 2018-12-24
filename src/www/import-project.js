const userAppStore = require('../../index.js')

module.exports = {
  get: renderPage,
  post: submitForm
}

async function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html)
  if (req.body) {
    const input = doc.getElementById('projectid')
    input.setAttribute('value', req.body.projectid || '')
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
    if (error.message.startsWith('invalid-')) {
      return renderPage(req, res, error.message)
    }
    return renderPage(req, res, error.message)
  }
}
