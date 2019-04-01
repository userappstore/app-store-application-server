const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  req.query.all = true
  const subscriptions = await global.api.user.userappstore.Subscriptions.get(req)
  if (subscriptions && subscriptions.length) {
    for (const subscription of subscriptions) {
      req.query.installid = subscription.metadata.installid
      subscription.install = await global.api.user.userappstore.Install.get(req)
      subscription.install.subscriptions = subscription.install.subscriptions || []
      if (subscription.install.organizationid) {
        subscription.organization = await dashboardServer.get(`/api/user/organizations/organization?organizationid=${subscription.install.organizationid}`, req.account.accountid, req.session.sessionid)
      }
      subscription.amountFormatted = money(subscription.plan.amount, subscription.quantity, subscription.plan.currency)
      subscription.nextCharge = userAppStore.Timestamp.date(subscription.current_period_end)
    }
  }
  const organizationSubscriptions = await global.api.user.userappstore.OrganizationSubscriptions.get(req)
  if (organizationSubscriptions && organizationSubscriptions.length) {
    const installs = await global.api.user.userappstore.Installs.get(req)
    const installSubscriptions = {}
    if (installs && installs.length) {
      for (const install of installs) {
        if (install.subscriptionid) {
          installSubscriptions[install.subscriptionid] = true
        }
      }
    }
    for (const subscription of organizationSubscriptions) {
      req.query.installid = subscription.metadata.installid
      subscription.install = await global.api.user.userappstore.OrganizationInstall.get(req)
      subscription.organization = await dashboardServer.get(`/api/user/organizations/organization?organizationid=${subscription.metadata.organizationid}`, req.account.accountid, req.session.sessionid)
      subscription.membership = await dashboardServer.get(`/api/user/organizations/membership?membershipid=${subscription.metadata.membershipid}`, req.account.accountid, req.session.sessionid)
      subscription.configured = installSubscriptions[subscription.id] === true
    }
  }
  req.data = { subscriptions, organizationSubscriptions }
}

async function renderPage (req, res) {
  const doc = userAppStore.HTML.parse(req.route.html)
  console.log('rendering', req.data)

  const removeFields = []
  if (req.data.subscriptions && req.data.subscriptions.length) {
    console.log('rendering organiztaoin subscriptions')
    userAppStore.HTML.renderTable(doc, req.data.subscriptions, 'subscription-row', 'subscriptions-table')
    for (const subscription of req.data.subscriptions) {
      console.log('fixing', subscription.id)
      if (subscription.install.organizationid) {
        removeFields.push(`personal-${subscription.id}`)
      } else {
        removeFields.push(`organization-${subscription.id}`)
      }
      if (subscription.install.type === 'project') {
        removeFields.push(`import-${subscription.id}`, `app-${subscription.id}`)
      } else if (subscription.install.type === 'app') {
        removeFields.push(`import-${subscription.id}`, `project-${subscription.id}`)
      } else {
        removeFields.push(`project-${subscription.id}`, `app-${subscription.id}`)
      }
      if (subscription.status === 'active') {
        if (subscription.cancel_at_period_end) {
          removeFields.push(`active-subscription-${subscription.id}`, `trialing-subscription-${subscription.id}`, `inactive-subscription-${subscription.id}`, `cancelsubscription-link-${subscription.id}`)
        } else {
          if (subscription.trial_end > userAppStore.Timestamp.now) {
            removeFields.push(`active-subscription-${subscription.id}`, `canceling-subscription-${subscription.id}`, `inactive-subscription-${subscription.id}`)
          } else {
            removeFields.push(`trialing-subscription-${subscription.id}`, `canceling-subscription-${subscription.id}`, `inactive-subscription-${subscription.id}`)
          }
        }
      } else {
        removeFields.push(`active-subscription-${subscription.id}`, `trialing-subscription-${subscription.id}`, `canceling-subscription-${req.data.subscription.id}`)
      }
    }
    const noSubscriptions = doc.getElementById('no-subscriptions')
    noSubscriptions.parentNode.removeChild(noSubscriptions)
  } else {
    const subscriptionsTable = doc.getElementById('subscriptions-table')
    subscriptionsTable.parentNode.removeChild(subscriptionsTable)
  }
  if (req.data.organizationSubscriptions && req.data.organizationSubscriptions.length) {
    console.log('rendering organiztaoin subscriptions')
    console.log('fixing', subscription.id)
    userAppStore.HTML.renderTable(doc, req.data.organizationSubscriptions, 'organization-subscription-row', 'organization-subscriptions-table')
    for (const subscription of req.data.organizationSubscriptions) {
      if (subscription.install.type === 'project') {
        removeFields.push(
          subscription.configured ? `project-pending-${subscription.id}` : `project-installed-${subscription.id}`,
          `import-installed-${subscription.id}`, `import-pending-${subscription.id}`, 
          `app-installed-${subscription.id}`, `app-pending-${subscription.id}`)
      } else if (subscription.install.type === 'app') {
        removeFields.push(
          subscription.configured ? `app-pending-${subscription.id}` : `app-installed-${subscription.id}`,
          `import-installed-${subscription.id}`, `import-pending-${subscription.id}`,
          `project-installed-${subscription.id}`, `project-pending-${subscription.id}`)
      } else {
        removeFields.push(
          subscription.configured ? `project-pending-${subscription.id}` : `project-installed-${subscription.id}`,
          `import-installed-${subscription.id}`, `import-pending-${subscription.id}`,
          `app-installed-${subscription.id}`, `app-pending-${subscription.id}`)
      }
      if (subscription.status === 'active') {
        if (subscription.cancel_at_period_end) {
          removeFields.push(`active-subscription-${subscription.id}`, `trialing-subscription-${subscription.id}`, `inactive-subscription-${subscription.id}`)
        } else {
          if (subscription.trial_end > userAppStore.Timestamp.now) {
            removeFields.push(`active-subscription-${subscription.id}`, `canceling-subscription-${subscription.id}`, `inactive-subscription-${subscription.id}`)
          } else {
            removeFields.push(`trialing-subscription-${subscription.id}`, `canceling-subscription-${subscription.id}`, `inactive-subscription-${subscription.id}`)
          }
        }
      } else {
        removeFields.push(`active-subscription-${subscription.id}`, `trialing-subscription-${subscription.id}`, `canceling-subscription-${req.data.subscription.id}`)
      }
    }
    const noOrganizationSubscriptions = doc.getElementById('no-organization-subscriptions')
    noOrganizationSubscriptions.parentNode.removeChild(noOrganizationSubscriptions)
  } else {
    const organizationsSubscriptionsTable = doc.getElementById('organization-subscriptions-table')
    organizationsSubscriptionsTable.parentNode.removeChild(organizationsSubscriptionsTable)
  }
  for (const field of removeFields) {
    const element = doc.getElementById(field)
    element.parentNode.removeChild(element)
  }
  return res.end(doc.toString())
}

function money (amount, quantity, currency) {
  if (!currency) {
    return null
  }
  quantity = quantity ? quantity + 1 : 1
  amount *= quantity
  currency = currency.toLowerCase()
  switch (currency) {
    case 'usd':
      return amount >= 0 ? `$${(amount / 100).toFixed(2)}` : `-$${(amount / -100).toFixed(2)}`
    case 'eu':
      return amount >= 0 ? `€${(amount / 100).toFixed(2)}` : `-€${(amount / -100).toFixed(2)}`
    case 'gbp':
      return amount > 0 ? `£${(amount / 100).toFixed(2)}` : `-£${(amount / -100).toFixed(2)}`
    default:
      return amount
  }
}