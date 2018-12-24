const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.appid) {
    throw new Error('invalid-appid')
  }
  const app = await global.api.user.userappstore.App.get(req)
  if (app.accountid !== req.account.accountid) {
    throw new Error('invalid-account')
  }
  req.data = { app }
}

async function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.app, 'app')
  return res.end(doc.toString())
}
