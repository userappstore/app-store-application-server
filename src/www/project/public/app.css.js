module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.projectid) {
    throw new Error('invalid-projectid')
  }
  const project = await global.api.user.userappstore.Project.get(req)
  if (project.accountid !== req.account.accountid) {
    throw new Error('invalid-account')
  }
  const files = await global.api.user.userappstore.ProjectFiles.get(req)
  req.data = {files}
}

async function renderPage (req, res) {
  res.setHeader('content-type', 'text/css')
  return res.end(req.data.files['app.css'] || '')
}
