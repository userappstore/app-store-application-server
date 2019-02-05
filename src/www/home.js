const dashboardServer = require('../dashboard-server.js')
const sevenDaysInSeconds = 7 * 24 * 60 * 60
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  const offset = req.query && req.query.offset ? parseInt(req.query.offset, 10) : 0
  const total = await global.api.user.userappstore.AllPublishedAppsCount.get(req)
  const apps = await global.api.user.userappstore.AllPublishedApps.get(req)
  if (!apps || !apps.length) {
    return
  }
  const subscriptions = await dashboardServer.get(`/api/user/subscriptions/subscriptions?accountid=${req.account.accountid}&all=true`, req.account.accountid, req.session.sessionid)
  let trialsEnding, subscriptionsCharging
  if (subscriptions && subscriptions.length) {
    trialsEnding = []
    subscriptionsCharging = []
    for (const subscription of subscriptions) {
      if (subscription.status === 'trialing' && subscription.trial_end >= userAppStore.Timestampw.now - sevenDaysInSeconds) {
        trialsEnding.push(subscription)
      }
      if (subscription.status === 'active' && subscription.current_period_end  >= userAppStore.Timestampw.now - sevenDaysInSeconds) {
        subscriptionsCharging.push(subscription)
      }
    }
  }
  // organization installs
  req.query.all = true
  const pending = await global.api.user.userappstore.UnconfiguredOrganizationInstalls.get(req)
  req.data = { apps, total, offset, trialsEnding, subscriptionsCharging, pending }
}

async function renderPage (req, res) {
  const doc = userAppStore.HTML.parse(req.route.html)
  if (req.data && req.data.trialsEnding && req.trialsEnding.trials.length) {
    userAppStore.HTML.renderList(doc, req.data.trialsEnding, 'trial-item', 'trials-list')
  } else {
    const trials = doc.getElementById('trials-list')
    trials.parentNode.removeChild(trials)
  }
  if (req.data && req.data.subscriptionsCharging && req.data.subscriptionsCharging.length) {
    userAppStore.HTML.renderList(doc, req.data.subscriptionsCharging, 'charging-item', 'charging-list')
  } else {
    const charging = doc.getElementById('charging-list')
    charging.parentNode.removeChild(charging)
  }
  if (req.data && req.data.pending && req.data.pending.length) {
    userAppStore.HTML.renderList(doc, req.data.pending, 'pending-item', 'pending-list')
  } else {
    const pending = doc.getElementById('pending-container')
    pending.parentNode.removeChild(pending)
  }
  if (req.data && req.data.apps && req.data.apps.length) {
    userAppStore.HTML.renderList(doc, req.data.apps, 'app-item', 'apps-list')
  }
  return res.end(doc.toString())
}
