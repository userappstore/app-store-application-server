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
  if (req.query.filename &&
      req.query.filename !== 'home.html' &&
      req.query.filename !== 'app.css' &&
      req.query.filename !== 'app.js') {
    throw new Error('invalid-filename')
  }
  const project = await global.api.user.userappstore.Project.get(req)
  if (project.accountid !== req.account.accountid) {
    throw new Error('invalid-project')
  }
  const projectFiles = await global.api.user.userappstore.ProjectFiles.get(req)
  const files = []
  for (const filename in projectFiles) {
    files.push({
      object: 'file',
      filename,
      icon: filename.substring(filename.indexOf('.') + 1),
      projectid: req.query.projectid,
      text: encodeURI(projectFiles[filename] || '')
    })
  }
  req.data = { project, files }
}

function renderPage (req, res) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.project, 'project')
  userAppStore.HTML.renderList(doc, req.data.files, 'file-editor', 'editors')
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (req.body['home.html']) {
    req.body['home.html'] = decodeURI(req.body['home.html']).split('%2B').join('+')
  }
  if (req.body['app.js']) {
    req.body['app.js'] = decodeURI(req.body['app.js']).split('%2B').join('+')
  }
  if (req.body['app.css']) {
    req.body['app.css'] = decodeURI(req.body['app.css']).split('%2B').join('+')
  }
  const projectFiles = await global.api.user.userappstore.UpdateProjectFiles.patch(req)
  req.data.files = []
  for (const filename in projectFiles) {
    req.data.files.push({
      object: 'file',
      filename,
      icon: filename.substring(filename.indexOf('.') + 1),
      projectid: req.query.projectid,
      text: encodeURI(projectFiles[filename] || '')
    })
  }
  return renderPage(req, res)
}
