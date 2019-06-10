const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  const stripeAccounts = await dashboardServer.get(`/api/user/connect/stripe-accounts?accountid=${req.account.accountid}&all=true`, req.account.accountid, req.session.sessionid)
  const accounts = []
  if (stripeAccounts && stripeAccounts.length) {
    for (const stripeAccount of stripeAccounts) {
      if (!stripeAccount.payouts_enabled || !stripeAccount.metadata.submitted) {
        continue
      }
      accounts.push(stripeAccount)
    }
  }
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  req.query.all = true
  const servers = await global.api.user.userappstore.ApplicationServers.get(req)
  if (servers && servers.length) {
    for (const server of servers) {
      if (server.appid) {
        servers.splice(servers.indexOf(server), 1)
      }
    } 
  }
  req.data = { stripeAccounts, servers }
}

async function renderPage(req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html)
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, req.data ? req.data.project : null, messageTemplate, 'message-container')
  }
  if (req.data.servers && req.data.servers.length) {
    userAppStore.HTML.renderList(doc, req.data.servers, 'server-option', 'serverid')
  }
  if (req.data.stripeAccounts && req.data.stripeAccounts.length) {
    userAppStore.HTML.renderList(doc, req.data.stripeAccounts, 'account-option', 'stripeid')
    for (const account of req.data.stripeAccounts) {
      if (account.legal_entity.type === 'individual') {
        const individualName = doc.getElementById(`individual-${account.id}`)
        individualName.parentNode.removeChild(individualName)
      } else {
        const businessName = doc.getElementById(`business-${account.id}`)
        businessName.parentNode.removeChild(businessName)
      }
    }
  }
  const idField = doc.getElementById('appid')
  if (req.body) {
    idField.setAttribute('value', req.body.appid || '')
    if (req.body.serverid) {
      userAppStore.HTML.setSelectedOptionByValue(doc, 'serverid', req.body.serverid)
    }
  } else {
    idField.setAttribute('value', userAppStore.UUID.friendly())
  }
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (!req.body.appid || !req.body.appid.length) {
    return renderPage(req, res, 'invalid-appid')
  }
  if (!req.body.stripeid || !req.body.stripeid.length) {
    return renderPage(req, res, 'invalid-stripeid')
  }
  if (!global.applicationFee) {
    if (req.body.application_fee !== '0.05' && 
      req.body.application_fee !== '0.1' && 
      req.body.application_fee !== '0.15' && 
      req.body.application_fee !== '0.2') {
        throw new Error('invalid-application_fee')
      }
  }
  let stripeAccount
  if (req.data.stripeAccounts && req.data.stripeAccounts.length) {
    for (const account of req.data.stripeAccounts) {
      if (account.id === req.body.stripeid) {
        stripeAccount = account
      }
    }
  }
  if (!stripeAccount) {
    return renderPage(req, res, 'invalid-stripeid')
  }
  if (req.body.appid && !req.body.appid.match(/^[a-zA-Z0-9\-]+$/)) {
    return renderPage(req, res, 'invalid-appid')
  }
  if (!req.body.serverid || !req.body.serverid.length) {
    return renderPage(req, res, 'invalid-application-serverid')
  }
  if (!req.data.servers || !req.data.servers) {
    return renderPage(req, res, 'invalid-application-serverid') 
  }
  let found = false
  for (const server of req.data.servers) {
    found = server.serverid === req.body.serverid
    if (found) {
      break
    }
  }
  if (!found) {
    return renderPage(req, res, 'invalid-application-serverid')
  }
  try {
    const app = await global.api.user.userappstore.CreateApp.post(req)
    res.statusCode = 302
    res.setHeader('location', `/app?appid=${app.appid}`)
    return res.end()
  } catch (error) {
    return renderPage(req, res, error.message)
  } 
}
