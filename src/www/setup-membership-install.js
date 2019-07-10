const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest(req) {
  if (!req.query || !req.query.installid) {
    throw new Error('invalid-installid')
  }
  const install = await global.api.user.userappstore.OrganizationInstall.get(req)
  if (!install) {
    throw new Error('invalid-installid')
  }
  req.query.appid = install.appid
  const app = await global.api.user.userappstore.PublishedApp.get(req)
  install.app = app
  req.query.serverid = app.serverid
  const server = await global.api.user.userappstore.ApplicationServer.get(req)
  req.query.all = true
  const plan = await dashboardServer.get(`/api/user/subscriptions/published-plan?planid=${install.planid}`, null, null, server.applicationServer, server.applicationServerToken)
  const organization = await dashboardServer.get(`/api/user/organizations/organization?organizationid=${install.organizationid}`, req.account.accountid, req.session.sessionid)
  const membership = await dashboardServer.get(`/api/user/organizations/organization-membership?organizationid=${install.organizationid}`, req.account.accountid, req.session.sessionid)
 req.query.accountid = req.account.accountid
  const collections = await global.api.user.userappstore.Collections.get(req)
  req.data = { app, plan, organization, collections, install, membership }
}

function renderPage(req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.install, 'install')
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
  }
  const textField = doc.getElementById('text')
  if (req.method === 'GET') {
    textField.setAttribute('value', req.data.app.name)
  } else {
    textField.setAttribute('value', req.body.text || '')
  }
  userAppStore.HTML.renderTemplate(doc, req.data.organization, 'organization-option', 'organizations-list')
  userAppStore.HTML.renderTemplate(doc, req.data.plan, 'plan-option', 'plans-list')
  if (req.data.collections && req.data.collections.length) {
    userAppStore.HTML.renderList(doc, req.data.collections, 'collection-option', 'collections-list')
    if (req.method === 'GET') {
      userAppStore.HTML.setSelectedOptionByValue(doc, 'collections-list', req.query.collectionid || '')
    } else {
      userAppStore.HTML.setSelectedOptionByValue(doc, 'collections-list', req.body.collectionid || '')
    }
  } else {
    const collectionContainer = doc.getElementById('collection-container')
    collectionContainer.parentNode.removeChild(collectionContainer)
  }
  return res.end(doc.toString())
}

async function submitForm(req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (!req.body.text || !req.body.text.length) {
    return renderPage(req, res, 'invalid-text')
  }
  // If the user is included in the installer's subscription they complete the install
  if (req.data.install.subscriptions && req.data.install.subscriptions.length) {
    if (req.data.install.subscriptions.indexOf(req.data.membership.membershipid) > -1) {
      req.query.accountid = req.account.accountid
      req.body.appid = req.query.appid
      try {
        const install = await global.api.user.userappstore.CreateMembershipInstall.post(req)
        res.statusCode = 302
        res.setHeader('location', `/setup-install-profile?installid=${install.installid}`)
        return res.end()
      } catch (error) {
        return renderPage(req, res, error.message)
      }
    }
  }
  // The user must confirm their subscription and select billing details
  try {
    res.statusCode = 302
    res.setHeader('location', `/setup-subscription?installid=${req.data.install.installid}`)
    return res.end()
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
