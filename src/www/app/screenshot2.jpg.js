const userAppStore = require('../../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderFile
}

async function beforeRequest (req) {
  if (!req.query || !req.query.appid) {
    throw new Error('invalid-appid')
  }
  const app = await global.api.user.userappstore.App.get(req)
  let screenshot
  if (app.screenshots &&
      app.screenshots.length > 1 &&
      app.screenshots[1]) {
    try {
      screenshot = await userAppStore.Storage.readImage('assets/' + app.appid + '/screenshot1.jpg')
    } catch (error) {
    }
  }
  req.data = { app, screenshot }
}

function renderFile (req, res) {
  if (!req.data.screenshot) {
    res.statusCode = 404
    return res.end()
  }
  res.statusCode = 200
  res.setHeader('content-type', 'image/jpeg')
  res.setHeader('content-length', req.data.screenshot.length)
  return res.end(req.data.screenshot, 'binary')
}
