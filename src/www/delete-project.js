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
  if (project.accountid !== req.account.accountid) {
    throw new Error('invalid-account')
  }
  req.data = { project }
}

async function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.project, 'project')
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, req.data.project, messageTemplate, 'message-container')
  } else {
    userAppStore.HTML.renderTemplate(doc, req.data.project, 'project-files', 'message-container')
  }
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  try {
    await global.api.user.userappstore.DeleteProject.delete(req)
    return renderPage(req, res, 'success')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
