const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest(req) {
  if (!req.query || !req.query.serverid) {
    throw new Error('invalid-serverid')
  }
  const server = await global.api.user.userappstore.ApplicationServer.get(req)
  if (!server) {
    throw new Error('invalid-serverid')
  }
  server.createdFormatted = userAppStore.Timestamp.date(server.created)
  server.token = '************************************'
  req.data = { server }
}

async function renderPage(req, res) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.server, 'server')
  if (!req.data.server.projectid) {
    const project = doc.getElementById('project')
    project.parentNode.removeChild(project)
  } else {
    const url = doc.getElementById('url')
    url.parentNode.removeChild(url)
  }
  if (!req.data.server.appid) {
    const app = doc.getElementById('app')
    app.parentNode.removeChild(app)
  }
  return res.end(doc.toString())
}
