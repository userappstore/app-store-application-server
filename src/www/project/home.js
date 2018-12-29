const navbar = require('../navbar-project.js')
const userAppStore = require('../../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.projectid) {
    throw new Error('invalid-projectid')
  }
  const project = await global.api.user.userappstore.Project.get(req)
  const files = await global.api.user.userappstore.ProjectFiles.get(req)
  req.data = { project, files }
}

async function renderPage (req, res) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.project, 'project')
  navbar.setup(doc, req)
  let project
  if (req.data.files['home.html'] && req.data.files['home.html'].length) {
    try {
      project = userAppStore.HTML.parse(req.data.files['home.html'])
    } catch (error) {
    }
  }
  project = project || userAppStore.HTML.parse(`<html><body></body></html>`)
  // The project's <template id="navbar" /> conflicts with the page
  // so the project one gets renamed to app-navbar, and then the
  // Dashboard places that in a secondary navigation found in
  // UserAppStore's template.  When a project is exported it will
  // stay named navbar and use the Dashboard template's navigation.
  const projectNavbar = project.getElementById('navbar')
  if (projectNavbar) {
    projectNavbar.attr.id = 'app-navbar'
  }
  // The project's <template id="head" /> can't be used on
  // UserAppStore because it adds HTML to the <head> of the
  // template, so it's renamed to exclude it.  When a project
  // is exported you can use that tag to add to your template.
  const projectHead = project.getElementById('head')
  if (projectHead) {
    projectNavbar.attr.id = 'app-head'
  }
  // remap /home, /app.css and /app.js
  let projectHTML = project.toString()
  projectHTML = projectHTML.split('/home').join(`/project/${req.data.project.projectid}/home`)
  projectHTML = projectHTML.split('/public/app.js').join(`/project/${req.data.project.projectid}/public/app.js`)
  projectHTML = projectHTML.split('/public/app.css').join(`/project/${req.data.project.projectid}/public/app.css`)
  // add the page navigation and script
  const navbar2 = doc.getElementById('navbar')
  project.appendChild(navbar2)
  return res.end(project.toString())
}
