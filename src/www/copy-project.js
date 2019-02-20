const userAppStore = require('../../index.js')

module.exports = {
  get: renderPage,
  post: submitForm
}

async function renderPage(req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html)
  const input = doc.getElementById('projectid')
  if (req.body) {  
    input.setAttribute('value', req.body.projectid || '')
  } else if (req.query) {
    input.setAttribute('value', req.query.rojectid || '')
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
    res.statusCode = 302
    res.setHeader('location', `/project?projectid=${req.body.projectid}`)
    return res.end()
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
