const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest(req) {
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
  req.query.stripeid = app.stripeid
  const publisher = await global.api.user.userappstore.Publisher.get(req)
  publisher.registeredFormatted = new Date(publisher.registered)
  req.query.serverid = app.serverid
  const server = await global.api.user.userappstore.ApplicationServer.get(req)
  const plans = await dashboardServer.get(`/api/user/subscriptions/published-plans`, null, null, server.applicationServer, server.applicationServerToken)
  if (plans && plans.length) {
    for (const plan of plans) {
      plan.appid = req.query.appid
      switch (plan.currency) {
        case 'usd':
          plan.amountFormatted = `$${plan.amount / 100}`
          break
        default:
          plan.amountFormatted = plan.amount
          break
      }
    }
  }
  req.data = { app, screenshots, tags, publisher, plans }
}

async function renderPage(req, res) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.app, 'app')
  userAppStore.HTML.renderTemplate(doc, req.data.publisher, 'publisher-template', 'publisher')
  if (req.data.tags && req.data.tags.length) {
    userAppStore.HTML.renderList(doc, req.data.tags, 'tag-item', 'tags')
  }
  if (req.data.plans && req.data.plans.length) {
    userAppStore.HTML.renderTable(doc, req.data.plans, 'plan-row', 'plans-table')
  }
  if (req.data.screenshots && req.data.screenshots.length) {
    userAppStore.HTML.renderList(doc, req.data.screenshots, 'screenshot-item', 'screenshots')
  }
  return res.end(doc.toString())
}
