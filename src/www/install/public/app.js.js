module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest(req) {
  if (!req.query || !req.query.installid) {
    throw new Error('invalid-installid')
  }
  const install = await global.api.user.userappstore.Install.get(req)
  if (install.projectid) {
    req.query.projectid = install.projectid
    project = await global.api.user.userappstore.SharedProject.get(req)
  } else if (install.appid) { 
    req.query.appid = install.appid
    app = await global.api.user.userappstore.PublishedApp.get(req)
    if (!app.projectid) {
      throw new Error('invalid-install')
    }
    req.query.projectid = app.projectid 
    project = await global.api.user.userappstore.SharedProject.get(req)
  } else {
    throw new Error('invalid-install')
  }
  const files = await global.api.user.userappstore.SharedProjectFiles.get(req)
  req.data = { files }
}

async function renderPage(req, res) {
  res.setHeader('content-type', 'text/javascript')
  return res.end(req.data.files['app.js'] || '')
}
