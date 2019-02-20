const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  const total = await global.api.user.userappstore.ProjectsCount.get(req)
  const projects = await global.api.user.userappstore.Projects.get(req)
  if (projects && projects.length) {
    for (const project of projects) {
      project.created = userAppStore.Timestamp.date(project.created)
    }
  }
  const offset = req.query ? parseInt(req.query.offset, 10) || 0 : 0
  const sampleProjects = await global.api.user.userappstore.SampleProjects.get(req)
  req.data = { projects, total, offset, sampleProjects }
}

async function renderPage (req, res) {
  const doc = userAppStore.HTML.parse(req.route.html)
  if (req.data.projects && req.data.projects.length) {
    userAppStore.HTML.renderTable(doc, req.data.projects, 'project-row', 'projects-table')
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      userAppStore.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    const noProjects = doc.getElementById('no-projects')
    noProjects.parentNode.removeChild(noProjects)
  } else {
    const projectsTable = doc.getElementById('projects-table')
    projectsTable.parentNode.removeChild(projectsTable)
  }
  if (req.data.sampleProjects && req.data.sampleProjects.length) {
    userAppStore.HTML.renderTable(doc, req.data.sampleProjects, 'sample-project-row', 'sample-projects-table')
  }
  return res.end(doc.toString())
}
