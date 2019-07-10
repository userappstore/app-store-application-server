const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.serverid) {
    throw new Error('invalid-serverid')
  }
  const server = await global.api.user.userappstore.ApplicationServer.get(req)
  let project
  if (server.projectid) {
    req.query.projectid = server.projectid
    project = await global.api.user.userappstore.SharedProject.get(req)
  }
  req.query.all = true
  const organizations = await dashboardServer.get(`/api/user/organizations/organizations?accountid=${req.account.accountid}&all=true`, req.account.accountid, req.session.sessionid)
  req.query.accountid = req.account.accountid
  const collections = await global.api.user.userappstore.Collections.get(req)
  req.data = { server, project, organizations, collections }
}

function renderPage(req, res, messageTemplate) {
  const importInfo = {
    object: 'import',
    title: req.data.project ? req.data.project.projectid : req.data.server.url.split('://')[1]
  }
  const doc = userAppStore.HTML.parse(req.route.html, importInfo, 'import')
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
  }
  const textField = doc.getElementById('text')
  if (req.method === 'GET') {
    textField.setAttribute('value', req.data.app.name)
  } else {
    textField.setAttribute('value', req.body.text || '')
  }
  if (req.data.organizations && req.data.organizations.length) {
    userAppStore.HTML.renderList(doc, req.data.organizations, 'organization-option', 'organizations-list')
    if (req.method === 'GET') {
      userAppStore.HTML.setSelectedOptionByValue(doc, 'organizations-list', 'personal')
    } else {
      userAppStore.HTML.setSelectedOptionByValue(doc, 'organizations-list', req.body.organizationid)
    }
  } else {
    const organizationsContainer = doc.getElementById('organizations-container')
    organizationsContainer.parentNode.removeChild(organizationsContainer)
  }
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

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (!req.body.text || !req.body.text.length) {
    return renderPage(req, res, 'invalid-text')
  }
  if (req.body.organizationid && req.body.organizationid !== 'personal') {
    let found = false
    if (req.data.organizations && req.data.organizations.length) {
      for (const organization of req.data.organizations) {
        if (organization.organizationid === req.body.organizationid) {
          found = true
          break
        }
      }
    }
    if (!found) {
      return renderPage(req, res, 'invalid-organizationid')
    }
  }
  try {
    req.query.accountid = req.account.accountid
    req.body.appid = req.query.appid
    const install = await global.api.user.userappstore.CreateInstall.post(req)
    res.statusCode = 302
    res.setHeader('location', `/install/${install.installid}/home`)
    return res.end()
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
