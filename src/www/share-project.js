const dashboardServer = require('../dashboard-server.js')
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
  const organizations = await dashboardServer.get(`/api/user/organizations/organizations?accountid=${req.account.accountid}`, req.account.accountid, req.session.sessionid)
  req.data = { project, organizations }
}

async function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.project, 'project')
  navbar.setup(doc, req)
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, req.data.project, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return res.end(doc.toString())
    }
  }
  if (req.data.project.shared) {
    const submitForm = doc.getElementById('submit-form')
    submitForm.parentNode.removeChild(submitForm)
    userAppStore.HTML.renderTemplate(doc, req.data.project, 'shared', 'message-container')
  } else {
    userAppStore.HTML.renderTemplate(doc, req.data.project, 'unshared', 'message-container')
    if (req.data.organizations && req.data.organizations.length) {
      userAppStore.HTML.renderList(doc, req.data.organizations, 'organization-option', 'organizationid')
    }
  }
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  if (!req.body) {    
    return renderPage(req, res)
  }
  try {
    await global.api.user.userappstore.SetProjectShared.patch(req)
    res.statusCode = 302
    res.setHeader('location', `/project?projectid=${req.query.projectid}`)
    return res.end()
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
