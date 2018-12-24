const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.appid) {
    throw new Error('invalid-appid')
  }
  const app = await global.api.user.userappstore.App.get(req)
  if (!app) {
    throw new Error('invalid-appid')
  }
  if (app.unpublished) {
    throw new Error('invalid-app')
  }
  app.screenshots = app.screenshots || []
  const stripeAccount = await dashboardServer.get(`/api/user/connect/stripe-account?stripeid=${app.stripeid}`, req.account.accountid, req.session.sessionid)
  if (!stripeAccount) {
    throw new Error('invalid-stripeid')
  }
  if (stripeAccount.metadata.accountid !== req.account.accountid) {
    throw new Error('invalid-stripe-account')
  }
  if (!stripeAccount.payouts_enabled) {
    throw new Error('invalid-stripe-account')
  }
  req.data = { app, stripeAccount }
}

async function renderPage (req, res, messageTemplate) {
  if (req.error) {
    messageTemplate = req.error
  }
  const doc = userAppStore.HTML.parse(req.route.html, req.data.app, 'app')
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      const form = doc.getElementById('submit-form')
      form.parentNode.removeChild(form)
      return res.end(doc.toString())
    }
  }
  const nameField = doc.getElementById('name')
  nameField.setAttribute('value', req.method === 'GET' ? req.data.app.name : req.body.name)
  const descriptionField = doc.getElementById('description')
  descriptionField.setInnerText(req.method === 'GET' ? req.data.app.description : req.body.description)
  if (!req.data.app.icon) {
    const previewIcon = doc.getElementById('preview-icon')
    previewIcon.setAttribute('style', '')
  }
  const existingTags = req.data.app.tags || ['', '', '', '']
  for (let i = 1; i < 5; i++) {
    const tagField = doc.getElementById(`tag${i}`)
    tagField.setAttribute('value', req.method === 'GET' ? existingTags[i - 1] : req.body[`tag${i}`])
  }
  if (req.data.app.icon) {
    const previewIcon = doc.getElementById('preview-icon')
    previewIcon.setAttribute('style', `background-image: url(/app/icon.png?appid=${req.query.appid})`)
  }
  if (req.data.app.screenshots && req.data.app.screenshots.length) {
    for (let i = 1; i < 5; i++) {
      if (req.data.app.screenshots.length < i || !req.data.app.screenshots[i - 1]) {
        continue
      }
      const previewScreenshot = doc.getElementById(`preview-screenshot${i}`)
      previewScreenshot.setAttribute('style', `background-image: url(/app/screenshot${i}.jpg?appid=${req.query.appid})`)
    }
  }
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  // the multipart POST data is not parsed at this point so
  // all validation is deferred to the API
  try {
    await global.api.user.userappstore.UpdateApp.patch(req)
    return renderPage(req, res, 'success')
  } catch (error) {
    if (error.message.startsWith('invalid-')) {
      return renderPage(req, res, error.message)
    }
    return renderPage(req, res, error.message)
  }
}
