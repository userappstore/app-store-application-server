const bcrypt = require('../bcrypt.js')
const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')
const exampleToken = bcrypt.hashSync(new Date().toUTCString(), bcrypt.genSaltSync(4))

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  const organizations = await dashboardServer.get(`/api/user/organizations/organizations?accountid=${req.account.accountid}`, req.account.accountid, req.session.sessionid)
  if (organizations && organizations.length) {
    req.data = { organizations }
  }
}

async function renderPage(req, res, messageTemplate) {
  if (req.error) {
    messageTemplate = req.error
  }
  const doc = userAppStore.HTML.parse(req.route.html)
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate !== 'success') {
      if (!req.body || !req.body.url) {
        const submitForm = doc.getElementById('submit-form')
        submitForm.parentNode.removeChild(submitForm)
        const claimingStart = doc.getElementById('claiming-start')
        claimingStart.parentNode.removeChild(claimingStart)
        const claimingGuide = doc.getElementById('claiming-guide')
        claimingGuide.parentNode.removeChild(claimingGuide)
        const usageGuide = doc.getElementById('usage-guide')
        usageGuide.parentNode.removeChild(usageGuide)
        return res.end(doc.toString())
      }
    }
    if (messageTemplate === 'success') {
      // step 3: completed guide
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      const claimingStart = doc.getElementById('claiming-start')
      claimingStart.parentNode.removeChild(claimingStart)
      const claimingGuide = doc.getElementById('claiming-guide')
      claimingGuide.parentNode.removeChild(claimingGuide)
      const token = doc.getElementById('token')
      token.setAttribute('value', req.data.applicationServer.applicationServerToken)
      return res.end(doc.toString())
    }
  }
  if (req.data && req.data.organizations && req.data.organizations.length) {
    userAppStore.HTML.renderList(doc, req.data.organizations, 'organization-option', 'organizationid')
  } else {
    const organizationContainer = doc.getElementById('organization-container')
    organizationContainer.parentNode.removeChild(organizationContainer)
  }
  // step 1: url form and integration guide
  if (req.method === 'GET' || !req.body) {
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
    const usageGuide = doc.getElementById('usage-guide')
    usageGuide.parentNode.removeChild(usageGuide)
    const organizationContainer = doc.getElementById('organization-container')
    if (organizationContainer) {
      organizationContainer.parentNode.removeChild(organizationContainer)
    }
    const selectedOrganizationid = doc.getElementById('selected-organizationid')
    if (req.body.organizationid) {
      selectedOrganizationid.setAttribute('value', req.body.organizationid)
    } else {
      selectedOrganizationid.parentNode.removeChild(selectedOrganizationid)
    }
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
  if (req.body.organizationid) {
    if (!req.data || !req.data.organizations || !req.data.organizations.length) {
      return renderPage(req, res, 'invalid-organizationid')
    }
    let found = false
    for (const organization of req.data.organizations) {
      found = organization.organizationid === req.body.organizationid
      if (found) {
        break
      }
    }
    if (!found) {
      return renderPage(req, res, 'invalid-organizationid')
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
  } else if (applicationServer.ownerid) {
    return renderPage(req, res, 'invalid-application-server')
  }
  req.query.serverid = applicationServer.serverid
  req.body.accountid = req.account.accountid
  try {
    const server = await global.api.user.userappstore.SetApplicationServerOwner.patch(req)
    if (req.body.organizationid && req.body.organizationid !== server.organizationid) {
      await global.api.user.userappstore.SetApplicationServerOrganization.patch(req)
    }
    req.data = { applicationServer }
    return renderPage(req, res, 'success')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
