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
      if (!stripeAccount.payouts_enabled) {
        continue
      }
      accounts.push(stripeAccount)
    }
  }
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  req.query.all = true
  const projects = await global.api.user.userappstore.Projects.get(req)
  req.data = { projects, accounts }
}

async function renderPage(req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html)
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, req.data ? req.data.project : null, messageTemplate, 'message-container')
  }
  if (req.data.projects && req.data.projects.length) {
    userAppStore.HTML.renderList(doc, req.data.projects, 'project-option', 'projectid')
  }
  if (req.data.accounts && req.data.accounts.length) {
    userAppStore.HTML.renderList(doc, req.data.accounts, 'account-option', 'stripeid')
    for (const account of req.data.accounts) {
      if (account.legal_entity.type === 'individual') {
        const individualName = doc.getElementById(`individual-${account.id}`)
        individualName.parentNode.removeChild(individualName)
      } else {
        const businessName = doc.getElementById(`business-${account.id}`)
        businessName.parentNode.removeChild(businessName)
      }
    }
  }
  if (req.body) {
    const idFIeld = doc.getElementById('appid')
    idFIeld.setAttribute('value', req.body.appid || '')
    if (req.body.projectid) {
      userAppStore.HTML.setSelectedOptionByValue(doc, 'projectid', req.body.projectid)
    } else if (req.body.url) {
      const urlField = doc.getElementById('url')
      urlField.setAttribute('value', req.body.url || '')
    }
  } else {
    const idFIeld = doc.getElementById('appid')
    idFIeld.setAttribute('value', userAppStore.UUID.friendly())
  }
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (!req.body.name || !req.body.name.length) {
    return renderPage(req, res, 'invalid-name')
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
  if (req.data.accounts && req.data.accounts.length) {
    for (const account of req.data.accounts) {
      if (account.id === req.body.stripeid) {
        stripeAccount = account
      }
    }
  }
  if (!stripeAccount) {
    return renderPage(req, res, 'invalid-stripeid')
  }
  if (!req.body.projectid && !req.body.url) {
    return renderPage(req, res, 'invalid-source')
  }
  if (req.body.projectid) {
    let found = false
    if (req.data.projects && req.data.projects.length) {
      for (const project of req.data.projects) {
        found = project.projectid === req.body.projectid
        if (found) {
          break
        }
      }
    }
    if (!found) {
      return renderPage(req, res, 'invalid-projectid')
    }
  } else if (req.body.url) {
    if (req.body.url.indexOf('https://') !== 0) {
      return renderPage(req, res, 'invalid-url')
    }
  }
  if (req.body.appid && !req.body.appid.match(/^[a-zA-Z0-9\-]+$/)) {
    return renderPage(req, res, 'invalid-appid')
  }
  try {
    const app = await global.api.user.userappstore.CreateApp.post(req)
    res.statusCode = 302
    res.setHeader('location', `/app?appid=${app.appid}`)
    return res.end()
  } catch (error) {
    if (error.message.startsWith('invalid-') || error.message.startsWith('duplicate-')) {
      return renderPage(req, res, error.message)
    }
    return renderPage(req, res, error.message)
  } 
}
