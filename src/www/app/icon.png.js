const userAppStore = require('../../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderFile
}

async function beforeRequest (req) {
  if (!req.query || !req.query.appid) {
    throw new Error('invalid-appid')
  }
  if (req.query.appid === '${app.appid}') {
    return res.end()
  }
  let app
  try {
    app = await global.api.user.userappstore.PublishedApp.get(req)
  } catch (error) {
  }
  if (!app) {
    return
  }
  let icon
  if (app.icon) {
    try {
      icon = await userAppStore.Storage.readImage(`assets/${app.appid}/icon.png`)
    } catch (error) {
    }
  }
  req.data = { app, icon }
}

function renderFile (req, res) {
  if (!req.data || !req.data.icon) {
    res.statusCode = 404
    return res.end()
  }
  res.statusCode = 200
  res.setHeader('content-type', 'image/png')
  res.setHeader('content-length', req.data.icon.length)
  return res.end(req.data.icon, 'binary')
}
