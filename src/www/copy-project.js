const userAppStore = require('../../index.js')

module.exports = {
  get: renderPage,
  post: submitForm
}

async function renderPage(req, res, messageTemplate) {
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

async function submitForm(req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (!req.body.sharedid || !req.body.sharedid.length) {
    return renderPage(req, res, 'invalid-sharedid')
  }
  if (!req.body.projectid || !req.body.projectid.length) {
    return renderPage(req, res, 'invalid-projectid')
  }
  req.query = req.query || {}
  req.query.projectid = req.body.sharedid
  try {
    await global.api.user.userappstore.SharedProject.get(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  try {
    await global.api.user.userappstore.CopySharedProject.post(req)
    return renderPage(req, res, 'success')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
