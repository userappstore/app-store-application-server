const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.appid) {
    throw new Error('invalid-appid')
  }
  const app = await global.api.user.userappstore.PublishedApp.get(req)
  if (!app.published) {
    throw new Error('invalid-app')
  }
  const tags = []
  if (app.tags && app.tags.length) {
    for (const tag of app.tags) {
      tags.push({ text: tag, encoded: encodeURI(tag), object: 'tag' })
    }
  }
  const screenshots = []
  if (app.screenshots && app.screenshots.length) {
    for (const i in app.screenshots) {
      screenshots.push({ number: (parseInt(i, 10) + 1), appid: req.query.appid, object: 'screenshot' })
    }
  }
  const stripeAccount = await dashboardServer.get(`/api/user/userappstore/publisher?stripeid=${app.stripeid}`, req.account.accountid, req.session.sessionid)
  const plans = await dashboardServer.get(`/api/user/${app.appid}/subscriptions/published-plans?stripeid=${app.stripeid}`, req.account.accountid, req.session.sessionid)
  req.data = { app, screenshots, tags, stripeAccount, plans }
}

async function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.app, 'app')
  if (req.data.tags && req.data.tags.length) {
    userAppStore.HTML.renderList(doc, req.data.tags, 'tag-item', 'tags')
  }
  if (req.data.plans && req.data.plans.length) {
    userAppStore.HTML.renderTable(doc, req.data.plans, 'plan-row', 'plans-table')
  }
  if (req.data.screenshots && req.data.screenshots.length) {
    userAppStore.HTML.renderList(doc, req.data.screenshots, 'screenshot-item', 'screenshots')
  }
  if (req.data.stripeAccount.legal_entity.type === 'individual') {
    userAppStore.HTML.renderTemplate(doc, req.data.stripeAccount, 'individual-publisher', 'publisher')
  } else {
    userAppStore.HTML.renderTemplate(doc, req.data.stripeAccount, 'company-publisher', 'publisher')
  }
  return res.end(doc.toString())
}
