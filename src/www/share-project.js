const navbar = require('./navbar-project.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.projectid) {
    throw new Error('invalid-projectid')
  }
  const project = await global.api.user.userappstore.Project.get(req)
  if (!project) {
    throw new Error('invalid-projectid')
  }
  if (project.shared) {
    throw new Error('invalid-project')
  }
  req.data = { project }
}

async function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.project, 'project')
  navbar.setup(doc, req)
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, req.data.project, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
    }
    return res.end(doc.toString())
  }
  if (req.data.project.shared) {
    const submitForm = doc.getElementById('submit-form')
    submitForm.parentNode.removeChild(submitForm)
    userAppStore.HTML.renderTemplate(doc, req.data.project, 'shared', 'message-container')
  } else {
    userAppStore.HTML.renderTemplate(doc, req.data.project, 'unshared', 'message-container')
  }
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  try {
    await global.api.user.userappstore.SetProjectShared.patch(req)
    return renderPage(req, res, 'success')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
