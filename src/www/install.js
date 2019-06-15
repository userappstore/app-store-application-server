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
  // get the next invoice for the subscription
  let subscription, invoices, nextInvoice
  if (install.subscriptionid) {
    subscription = await dashboardServer.get(`/api/application-server/subscription?installid=${install.installid}`, req.account.accountid, req.session.sessionid)
    invoices = await dashboardServer.get(`/api/application-server/subscription-invoices?installid=${install.installid}`, req.account.accountid, req.session.sessionid)
    if (!install.uninstalled) {
      nextInvoice = await dashboardServer.get(`/api/application-server/upcoming-invoice?installid=${install.installid}`, req.account.accountid, req.session.sessionid)
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
  if (req.data.install.uninstalled) {
    const installed = doc.getElementById('installed')
    installed.parentNode.removeChild(installed)
  } else {
    const uninstalled = doc.getElementById('uninstalled')
    uninstalled.parentNode.removeChild(uninstalled)
  }
  if (req.data.subscription) {
    const unknown = doc.getElementById('unknown')
    unknown.parentNode.removeChild(unknown)
    if (req.data.subscription.plan.amount) {
      const free = doc.getElementById('free')
      free.parentNode.removeChild(free)
      if (req.data.subscription.trial_start && !req.data.subscription.trial_end) {
        userAppStore.HTML.renderTemplate(doc, req.data.subscription, 'trial', 'trial-period')
        const charge = doc.getElementById('invoice-container')
        charge.parentNode.removeChild(charge)
      } else {
        req.data.nextInvoice.object = 'invoice'
        userAppStore.HTML.renderTemplate(doc, req.data.nextInvoice, 'invoice', 'next-invoice')
        const trial = doc.getElementById('trial-container')
        trial.parentNode.removeChild(trial)
      }
    } else {
      const paid = doc.getElementById('paid')
      paid.parentNode.removeChild(paid)
      const charge = doc.getElementById('charge-container')
      charge.parentNode.removeChild(charge)
    }
  } else {
    const free = doc.getElementById('free')
    free.parentNode.removeChild(free)
    const paid = doc.getElementById('paid')
    paid.parentNode.removeChild(paid)
    const trial = doc.getElementById('trial-container')
    trial.parentNode.removeChild(trial)
    const charge = doc.getElementById('charge-container')
    charge.parentNode.removeChild(charge)
  }
  if (req.data.organization) {
    userAppStore.HTML.renderList(doc, req.data.memberships, 'membership', 'memberships')
    const individual = doc.getElementById('individual')
    individual.parentNode.removeChild(individual)
  } else {
    const organization = doc.getElementById('organization')
    organization.parentNode.removeChild(organization)
    const memberships = doc.getElementById('memberships-container')
    memberships.parentNode.removeChild(memberships)
  }
  if (req.data.invoices && req.data.invoices.length) {
    userAppStore.HTML.renderList(doc, req.data.invoices, 'invoice', 'invoices')
  } else {
    const invoices = doc.getElementById('invoices-container')
    invoices.parentNode.removeChild(invoices)
  }
  if (req.data.install.projectid) {
    const url = doc.getElementById('url')
    url.parentNode.removeChild(url)
    const appStore = doc.getElementById('appstore')
    appStore.parentNode.removeChild(appStore)
    if (req.data.install.copied) {
      const shared = doc.getElementById('shared')
      shared.parentNode.removeChild(shared)
    } else {
      const owned = doc.getElementById('owned')
      owned.parentNode.removeChild(owned)
    }
  } else if (req.data.install.url) {
    const appStore = doc.getElementById('appstore')
    appStore.parentNode.removeChild(appStore)
    const project = doc.getElementById('project')
    project.parentNode.removeChild(project)
  } else {
    const project = doc.getElementById('project')
    project.parentNode.removeChild(project)
    const url = doc.getElementById('url')
    url.parentNode.removeChild(url)
  }
  return res.end(doc.toString())
}
