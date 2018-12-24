const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.projectid) {
    throw new Error('invalid-projectid')
  }
  const project = await global.api.user.userappstore.Project.get(req)
  const projectFiles = await global.api.user.userappstore.ProjectFiles.get(req)
  const files = []
  for (const filename in projectFiles) {
    const file = {
      object: 'file',
      filename,
      icon: filename.substring(filename.indexOf('.') + 1),
      projectid: req.query.projectid
    }
    file.size = projectFiles[filename] ? projectFiles[filename].length : 0
    file.sizeFormatted = file.size < 1000 ? file.size + ' B' : Math.floor(file.size / 1000) + ' KB'
    files.push(file)
  }
  req.data = { project, files }
}

async function renderPage (req, res) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.project, 'project')
  userAppStore.HTML.renderList(doc, req.data.files, 'file-item-template', 'files-list')
  if (req.data.project.shared) {
    userAppStore.HTML.renderTemplate(doc, req.data.project, 'shared', 'status')
  } else {
    userAppStore.HTML.renderTemplate(doc, req.data.project, 'unshared', 'status')
  }
  return res.end(doc.toString())
}
