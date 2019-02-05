const bcrypt = require('../bcrypt.js')
const userAppStore = require('../../index.js')
const exampleToken = bcrypt.hashSync(new Date().toUTCString(), bcrypt.genSaltSync(4))

module.exports = {
  get: renderPage,
  post: submitForm
}

async function renderPage(req, res, messageTemplate) {
  if (req.error) {
    messageTemplate = req.error
  }
  const doc = userAppStore.HTML.parse(req.route.html)
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate !== 'success') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      const integrationGuide = doc.getElementById('integration-guide')
      integrationGuide.parentNode.removeChild(integrationGuide)
      const claimingStart = doc.getElementById('claiming-start')
      claimingStart.parentNode.removeChild(claimingStart)
      const claimingGuide = doc.getElementById('claiming-guide')
      claimingGuide.parentNode.removeChild(claimingGuide)
      const usageGuide = doc.getElementById('usage-guide')
      usageGuide.parentNode.removeChild(usageGuide)
      return res.end(doc.toString())
    }
    if (messageTemplate === 'success') {
      // step 3: completed guide
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      const integrationGuide = doc.getElementById('integration-guide')
      integrationGuide.parentNode.removeChild(integrationGuide)
      const claimingStart = doc.getElementById('claiming-start')
      claimingStart.parentNode.removeChild(claimingStart)
      const claimingGuide = doc.getElementById('claiming-guide')
      claimingGuide.parentNode.removeChild(claimingGuide)
      const token = doc.getElementById('token')
      token.setAttribute('value', req.data.applicationServer.applicationServerToken)
      const header = {
        object: 'header',
        dashboardServer: process.env.DASHBOARD_SERVER,
        dashboardServerToken: exampleToken,
        applicationServerToken: req.data.applicationServer.applicationServerToken,
        applicationServer: req.data.applicationServer.applicationServer
      }
      userAppStore.HTML.renderTemplate(doc, header, 'token-usage', 'usage-headers')
      return res.end(doc.toString())
    }
  }
  // step 1: url form and integration guide
  if (req.method === 'GET' || !req.body) {
    const header = {
      object: 'header',
      dashboardServer: process.env.DASHBOARD_SERVER,
      token: exampleToken
    }
    userAppStore.HTML.renderTemplate(doc, header, 'integration-headers', 'integration-guide-header')
    const verificationContainer = doc.getElementById('verification-container')
    verificationContainer.parentNode.removeChild(verificationContainer)
    const submitClaimButton = doc.getElementById('submit-claim-button')
    submitClaimButton.parentNode.removeChild(submitClaimButton)
    const usageGuide = doc.getElementById('usage-guide')
    usageGuide.parentNode.removeChild(usageGuide)
    const claimingGuide = doc.getElementById('claiming-guide')
    claimingGuide.parentNode.removeChild(claimingGuide)
  }
  // step 2: url verification guide
  if (req.body && req.body.url) {
    const claimingStart = doc.getElementById('claiming-start')
    claimingStart.parentNode.removeChild(claimingStart)
    const urlField = doc.getElementById('url')
    urlField.setAttribute('value', req.body.url)
    const salt = await bcrypt.genSalt(4)
    const token = await bcrypt.hash(`${req.body.url}/${req.account.accountid}/${req.session.sessionid}`, salt)
    const tokenField = doc.getElementById('token')
    tokenField.setAttribute('value', token)
    const verificationPath = doc.getElementById('verification-path')
    verificationPath.setAttribute('value', `/authorized-app-stores/${process.env.DOMAIN}.txt`)
    const submitURLButton = doc.getElementById('submit-url-button')
    submitURLButton.parentNode.removeChild(submitURLButton)
    const integrationGuide = doc.getElementById('integration-guide')
    integrationGuide.parentNode.removeChild(integrationGuide)
    const usageGuide = doc.getElementById('usage-guide')
    usageGuide.parentNode.removeChild(usageGuide)
    const organizationContainer = doc.getElementById('organization-container')
    organizationContainer.parentNode.removeChild(organizationContainer)
  }
  return res.end(doc.toString())
}

async function submitForm(req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (!req.body.url || !req.body.url.length || !req.body.url.startsWith('https://')) {
    return renderPage(req, res, 'invalid-url')
  }
  if (req.body.url.length > 200) {
    return renderPage(req, res, 'invalid-url-length')
  }
  let applicationServer
  try {
    req.query.url = req.body.url
    applicationServer = await global.api.user.userappstore.UrlApplicationServer.get(req)
    if (applicationServer && applicationServer.ownerid) {
      return renderPage(req, res, 'duplicate-claim')
    }
  } catch (error) {
    if (error.message !== 'invalid-application-serverid') {
      return renderPage(req, res, error.message)
    }
  }
  if (req.body.refresh === 'true') {
    return renderPage(req, res)
  }
  if (!applicationServer) {
    req.query = req.query || {}
    req.query.accountid = req.account.accountid
    try {
      applicationServer = await global.api.user.userappstore.CreateApplicationServer.post(req)
    } catch (error) {
      return renderPage(req, res, error.message)
    }
  }
  req.query.serverid = applicationServer.serverid
  req.body.accountid = req.account.accountid
  try {
    await global.api.user.userappstore.SetApplicationServerOwner.patch(req)
    req.data = { applicationServer }
    return renderPage(req, res, 'success')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
