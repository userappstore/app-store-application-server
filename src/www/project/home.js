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
  project.owner = {
    object: 'owner',
    sessionid: req.session.sessionid,
    profileid: req.account.profileid,
    url: `${process.env.DASHBOARD_SERVER}/project/${req.query.projectid}/home`,
    root: `${process.env.DASHBOARD_SERVER}/project/${req.query.projectid}/`
  }
  const files = await global.api.user.userappstore.ProjectFiles.get(req)
  req.data = { project, files }
}

async function renderPage (req, res) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.project, 'project')
  let project
  if (req.data.files['home.html'] && req.data.files['home.html'].length) {
    try {
      project = userAppStore.HTML.parse(req.data.files['home.html'])
    } catch (error) {
    }
  }
  project = project || userAppStore.HTML.parse(`<html><body></body></html>`)
  // The project's <template id="navbar" /> conflicts with the page's
  // so the project one gets moved to <template id="head">, a container
  // for content to put in the Dashboard template's head.
  //
  // The project navbar is renamed app-navbar.  That ID also triggers
  // the Dashboard server to put the links in the secondary navigation.
  //
  // This allows projects to be compatible with using Dashboard directly
  // as a hosted web app.
  try {
    const projectNavbar = project.getElementById('navbar')
    if (projectNavbar) {
      projectNavbar.parentNode.removeChild(projectNavbar)
      projectNavbar.attr.id = 'app-navbar'
      const head = doc.getElementById('head')
      head.child = head.child || []
      head.appendChild(projectNavbar)
      project.appendChild(head)
    }
  } catch (error) {
  }
  // remap /home, /app.css and /app.js
  let projectHTML = project.toString()
  projectHTML = projectHTML.split('/home').join(`/project/${req.data.project.projectid}/home`)
  projectHTML = projectHTML.split('/user.js').join(`/project/${req.data.project.projectid}/user.js`)
  // fix navigation link getting previously well-formed /home links
  // projectHTML = projectHTML.split(`/project/${req.data.project.projectid}/project/${req.data.project.projectid}/home`).join(`/project/${req.data.project.projectid}/home`)
  projectHTML = projectHTML.split('/public/app.js').join(`/project/${req.data.project.projectid}/public/app.js`)
  projectHTML = projectHTML.split('/public/app.css').join(`/project/${req.data.project.projectid}/public/app.css`)
  project = userAppStore.HTML.parse(projectHTML)
  // add the page navigation and script
  const navbar = doc.getElementById('navbar')
  project.appendChild(navbar)
  const head = doc.getElementById('head')
  project.appendChild(head)
  return res.end(project.toString())
}
