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
  app.createdFormatted = userAppStore.Timestamp.date(app.created)
  req.data = { app }
}

async function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.app, 'app')
  if (!req.data.app.published) {
    const published = doc.getElementById(`published-${req.data.app.appid}`)
    published.parentNode.removeChild(published)
    const unpublished = doc.getElementById(`unpublished-${req.data.app.appid}`)
    unpublished.parentNode.removeChild(unpublished)
  } else if (!req.data.app.unpublished) {
    const draft = doc.getElementById(`draft-${req.data.app.appid}`)
    draft.parentNode.removeChild(draft)
    const unpublished = doc.getElementById(`unpublished-${req.data.app.appid}`)
    unpublished.parentNode.removeChild(unpublished)
  } else {
    const draft = doc.getElementById(`draft-${req.data.app.appid}`)
    draft.parentNode.removeChild(draft)
    const published = doc.getElementById(`published-${req.data.app.appid}`)
    published.parentNode.removeChild(published)
  }
  return res.end(doc.toString())
}
