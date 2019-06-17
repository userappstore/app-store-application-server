const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.installid) {
    throw new Error('invalid-installid')
  }
  const install = await global.api.user.userappstore.Install.get(req)
  if (!install) {
    throw new Error('invalid-installid')
  }
  install.installed = userAppStore.Timestamp.date(install.created)
  if (install.uninstalled) {
    install.uninstalled = userAppStore.Timestamp.date(install.uninstalled)
  }
  let subscription, invoices, nextInvoice
  if (install.subscriptionid) {
    subscription = await dashboardServer.get(`/api/application-server/subscription?installid=${install.installid}`, req.account.accountid, req.session.sessionid)
    invoices = await dashboardServer.get(`/api/application-server/subscription-invoices?installid=${install.installid}`, req.account.accountid, req.session.sessionid)
    if (invoices && invoices.length) {
      for (const invoice of invoices) {
        invoice.totalFormatted = userAppStore.Format.money(invoice.total, invoice.currency)
        invoice.periodStart = userAppStore.Timestamp.date(invoice.period_start * 1000)
        invoice.periodEnd = userAppStore.Timestamp.date(invoice.period_end * 1000)
      }
    }
    if (!install.uninstalled) {
      nextInvoice = await dashboardServer.get(`/api/application-server/upcoming-invoice?installid=${install.installid}`, req.account.accountid, req.session.sessionid)
      if (nextInvoice) {
        nextInvoice.date = userAppStore.Timestamp.date(nextInvoice.date)
        nextInvoice.totalFormatted = userAppStore.Format.money(nextInvoice.total, nextInvoice.currency)
      }
    }
  }
  // get the organization and members
  let organization, memberships
  if (install.organizationid) {
    organization = await dashboardServer.get(`/api/user/organizations/organization?organizationid=${install.organizationid}`, req.account.accountid, req.session.sessionid)
    memberships = await dashboardServer.get(`/api/user/organizations/organization-memberships?organizationid=${install.organizationid}`, req.account.accountid, req.session.sessionid)
  }
  req.data = { install, subscription, invoices, nextInvoice, organization, memberships }
}

async function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.install, 'install')
  const removeElements = []
  if (req.data.install.uninstalled) {
    removeElements.push('installed')
  } else {
    removeElements.push('uninstalled')
  }
  if (req.data.subscription) {
    removeElements.push('unknown')
    if (req.data.subscription.plan.amount) {
      removeElements.push('free')
      if (req.data.subscription.trial_start && !req.data.subscription.trial_end) {
        userAppStore.HTML.renderTemplate(doc, req.data.subscription, 'trial', 'trial-period')
        removeElements.push('invoice-container')
      } else {
        userAppStore.HTML.renderTemplate(doc, req.data.nextInvoice, 'upcoming-invoice-row', 'next-invoice-table')
        removeElements.push('trial-container')
      }
    } else {
      removeElements.push('paid')
    }
  } else {
    removeElements.push('free', 'paid', 'trial-container')
  }
  if (req.data.organization) {
    userAppStore.HTML.renderList(doc, req.data.memberships, 'membership', 'memberships')
    for (const membership of req.data.memberships) {
      const included = req.data.install.subscriptions && req.data.install.subscriptions.indexOf(membership.membershipid) > -1
      const own = membership.accountid === req.account.accountid
      if (included || own) {
        removeElements.push(`not-included-${membership.membershipid}`)
      } else {
        removeElements.push(`included-${membership.membershipid}`)
      }
    }
    removeElements.push('individual')
  } else {
    removeElements.push('organization', 'memberships-container')
  }
  if (req.data.invoices && req.data.invoices.length) {
    userAppStore.HTML.renderTable(doc, req.data.invoices, 'invoice-row', 'invoices-table')
  } else {
    removeElements.push('invoices-container')
  }
  if (req.data.install.projectid) {
    removeElements.push('url', 'appstore')
  } else if (req.data.install.url) {
    removeElements.push('appstore', 'project')
  } else {
    removeElements.push('project', 'url')
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return res.end(doc.toString())
}
