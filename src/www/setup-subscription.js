const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req, res) {
  if (!req.query || !req.query.installid) {
    throw new Error('invalid-installid')
  }
  const install = await global.api.user.userappstore.Install.get(req)
  if (!install.appid) {
    throw new Error('invalid-install')
  }
  let organization, memberships
  if (install.organizationid) {
    organization = await dashboardServer.get(`/api/user/organizations/organization?organizationid=${install.organizationid}`, req.account.accountid, req.session.sessionid)
    memberships = await dashboardServer.get(`/api/user/organizations/organization-memberships?organizationid=${install.organizationid}`, req.account.accountid, req.session.sessionid)
  }
  req.data = { install, organization, memberships }
}

function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.install, 'install')
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
  }
  if (req.data.memberships && req.data.memberships.length) {
    userAppStore.HTML.renderList(doc, req.data.memberships, 'membership-item', 'memberships-list')
  }
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (req.data.install.organizationid) {
    for (const field in req.body) {
      if (field.startsWith('member-')) {
        const membershipid = field.split('-')[1]
        let found = false
        for (const membership of req.data.memberships) {
          found = membership.membershipid === membershipid
          if (found) {
            break
          }
        }
        if (!found) {
          return renderPage(req, res, 'invalid-membershipid')
        }
      }
    }
  }
  // stash the members in the install info
  await global.api.user.userappstore.UpdateInstall.patch(req)
  req.success = true
  res.statusCode = 302
  res.setHeader('location', `/confirm-subscription?installid=${req.query.installid}`)
  return res.end()
}