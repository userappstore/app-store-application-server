const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest(req) {
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  let total = await global.api.user.userappstore.ApplicationServersCount.get(req)
  let applicationServers = await global.api.user.userappstore.ApplicationServers.get(req)
  const offset = req.query ? parseInt(req.query.offset, 10) || 0 : 0
  const organizations = await dashboardServer.get(`/api/user/organizations/organizations?accountid=${req.account.accountid}&all=true`, req.account.accountid, req.session.sessionid)
  if (organizations && organizations.length) {
    applicationServers = applicationServers || []
    for (const i in applicationServers) {
      if (applicationServers[i].organizationid) {
        applicationServers.splice(i, 1)
      }
    }
    req.query.all = true
    for (const organization of organizations) {
      req.query.organizationid = organization.organizationid
      let count = await global.api.user.userappstore.OrganizationApplicationServersCount.get(req)
      if (!count) {
        continue
      }
      const servers = await global.api.user.userappstore.OrganizationApplicationServers.get(req)
      applicationServers = applicationServers.concat(servers)
      total += count
    }
  }
  if (applicationServers && applicationServers.length) {
    for (const applicationServer of applicationServers) {
      applicationServer.createdFormatted = userAppStore.Timestamp.date(applicationServer.created)
      applicationServer.claimedFormatted = userAppStore.Timestamp.date(applicationServer.claimed)
    }
    applicationServers.sort(sortByCreated)
  }
  req.data = { applicationServers, total, offset }
}

function sortByCreated (server1, server2) {
  return server1.created > server2.created ? 1 : -1
}

async function renderPage(req, res) {
  const doc = userAppStore.HTML.parse(req.route.html)
  if (req.data.applicationServers && req.data.applicationServers.length) {
    userAppStore.HTML.renderTable(doc, req.data.applicationServers, 'application-server-row', 'application-servers-table')
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      userAppStore.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    const noApplicationServers = doc.getElementById('no-application-servers')
    noApplicationServers.parentNode.removeChild(noApplicationServers)
  } else {
    const applicationServersTable = doc.getElementById('application-servers-table')
    applicationServersTable.parentNode.removeChild(applicationServersTable)
  }
  return res.end(doc.toString())
}
