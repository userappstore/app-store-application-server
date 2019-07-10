const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.installid) {
    throw new Error('invalid-installid')
  }
  let install
  try {
    install = await global.api.user.userappstore.Install.get(req)
  } catch (error) {
  }
  if (!install) {
    try {
      install = await global.api.user.userappstore.OrganizationInstall.get(req)
    } catch (error) {
    }
  }
  if (!install) {
    throw new Error('invalid-installid')
  }
  if (!install.appid) {
    throw new Error('invalid-install')
  }
  req.query.appid = install.appid
  const app = await global.api.user.userappstore.PublishedApp.get(req)
  if (!app) {
    throw new Error('invalid-install')
  }
  install.app = app
  let organization, memberships
  if (install.organizationid) {
    memberships = await dashboardServer.get(`/api/user/organizations/organization-memberships?organizationid=${install.organizationid}`, req.account.accountid, req.session.sessionid)
    const installedMembers = await userAppStore.StorageList.listAll(`organization/app/members/${install.appid}/${install.organizationid}`)
    if (memberships && memberships.length) {
      for (const i in memberships) {
        const membership = memberships[i]
        // remove self
        if (membership.accountid === req.account.accountid) {
          memberships.splice(i, 1)
          continue
        }
        // remove anyone with their own subscription or included in a subscription
        if (installedMembers.indexOf(membership.membershipid) > -1) {
          memberships.splice(i, 1)
          continue
        }
      }
    }
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
  } else {
    res.statusCode = 302
    res.setHeader('location', `/confirm-subscription?installid=${req.query.installid}`)
    return res.end()
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
  try {
    await global.api.user.userappstore.UpdateInstall.patch(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  res.statusCode = 302
  res.setHeader('location', `/confirm-subscription?installid=${req.query.installid}`)
  return res.end()
}
