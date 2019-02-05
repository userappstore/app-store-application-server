const userAppStore = require('../../index.js')

module.exports = {
  get: renderPage,
  post: submitForm
}

async function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html)
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
  }
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  if (!req.body.name || !req.body.name.length) {
    return renderPage(req, res, 'invalid-name')
  }
  if (!req.body.text || !req.body.text.length) {
    return renderPage(req, res, 'invalid-text')
  }
  if (!req.body.background || !req.body.background.length) {
    return renderPage(req, res, 'invalid-background')
  }
  if (req.body.text.length === 3 || req.body.text.length === 6) {
    req.body.text = `#${req.body.text}`
  }
  if (req.body.background.length === 3 || req.body.background.length === 6) {
    req.body.background = `#${req.body.background}`
  }
  if (!req.body.text.startsWith('#') &&
      !req.body.text.startsWith('rgb(') &&
      !req.body.text.startsWith('rgba(')) {
    return renderPage(req, res, 'invalid-text')
  }
  if (!req.body.background.startsWith('#') &&
      !req.body.background.startsWith('rgb(') &&
      !req.body.background.startsWith('rgba(')) {
    return renderPage(req, res, 'invalid-background')
  }
  try {
    req.query = {accountid: req.account.accountid}
    const collection = await global.api.user.userappstore.CreateCollection.post(req)
    res.statusCode = 302
    res.setHeader('location', `/add-items?collectionid=${collection.collectionid}`)
    return res.end()
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
