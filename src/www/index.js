const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')
let sitemap

module.exports = {
  get: renderPage
}

async function renderPage (req, res) {
  const doc = userAppStore.HTML.parse(req.route.html)
  if (!sitemap) {
    sitemap = {}
    const dashboard = await dashboardServer.get(`/api/application-server/sitemap`, null, null)
    for (const url in global.sitemap) {
      dashboard[url] = 'application-server'
    }
    const object = 'data'
    const roots = [
      '/',
      '/account',
      '/account/organizations',
      '/account/subscriptions',
      '/account/connect',
      '/administrator',
      '/administrator/organizations',
      '/administrator/subscriptions',
      '/administrator/connect'
    ]
    for (const url in dashboard) {
      const origin = dashboard[url]
      sitemap[origin] = sitemap[origin] || {
        webAdministrator: [],
        webUser: [],
        apiAdministrator: [],
        apiUser: []
      }
      if (url.startsWith('/api/')) {
        if (url.startsWith('/api/user/')) {
          sitemap[origin].apiUser.push({ url })
        } else {
          sitemap[origin].apiAdministrator.push({ url })
        }
        continue
      }
      if (roots.indexOf(url) > 1) {
        if (url.startsWith('/administrator')) {
          sitemap[origin].webAdministrator.unshift({ url, object })
        } else {
          sitemap[origin].webUser.unshift({ url, object })
        }
      } else { 
        if (url.startsWith('/administrator')) {
          sitemap[origin].webAdministrator.push({ url, object })  
        } else {
          sitemap[origin].webUser.push({ url, object })
        }
      }
    }
  }
  sitemap['@userappstore/dashboard'].web = sitemap['@userappstore/dashboard'].webUser.concat(sitemap['@userappstore/dashboard'].webAdministrator)
  sitemap['@userappstore/dashboard'].api = sitemap['@userappstore/dashboard'].apiUser.concat(sitemap['@userappstore/dashboard'].apiAdministrator)
  sitemap['@userappstore/organizations'].web = sitemap['@userappstore/organizations'].webUser.concat(sitemap['@userappstore/organizations'].webAdministrator)
  sitemap['@userappstore/organizations'].api = sitemap['@userappstore/organizations'].apiUser.concat(sitemap['@userappstore/organizations'].apiAdministrator)
  sitemap['@userappstore/stripe-subscriptions'].web = sitemap['@userappstore/stripe-subscriptions'].webUser.concat(sitemap['@userappstore/stripe-subscrpitions'].webAdministrator)
  sitemap['@userappstore/stripe-subscriptions'].api = sitemap['@userappstore/stripe-subscriptions'].apiUser.concat(sitemap['@userappstore/stripe-subscrpitions'].apiAdministrator)
  sitemap['@userappstore/stripe-connect'].web = sitemap['@userappstore/stripe-connect'].webUser.concat(sitemap['@userappstore/stripe-connect'].webAdministrator)
  sitemap['@userappstore/stripe-connect'].api = sitemap['@userappstore/stripe-connect'].apiUser.concat(sitemap['@userappstore/stripe-connect'].apiAdministrator)
  sitemap['@userappstore/application-server'].web = sitemap['@userappstore/application-server'].webUser.concat(sitemap['@userappstore/application-server'].webAdministrator)
  sitemap['@userappstore/application-server'].api = sitemap['@userappstore/application-server'].apiUser.concat(sitemap['@userappstore/application-server'].apiAdministrator)
  sitemap['@userappstore/dashboard-server'].web = sitemap['@userappstore/dashboard-server'].webUser.concat(sitemap['@userappstore/dashboard-server'].webAdministrator)
  sitemap['@userappstore/dashboard-server'].api = sitemap['@userappstore/dashboard-server'].apiUser.concat(sitemap['@userappstore/dashboard-server'].apiAdministrator)
  userAppStore.HTML.renderList(doc, sitemap['@userappstore/dashboard'].web, 'url-data', 'dashboard-pages')
  userAppStore.HTML.renderList(doc, sitemap['@userappstore/dashboard'].api, 'url-data', 'dashboard-api')
  userAppStore.HTML.renderList(doc, sitemap['@userappstore/organizations'].web, 'url-data', 'organizations-module-pages')
  userAppStore.HTML.renderList(doc, sitemap['@userappstore/organizations'].api, 'url-data', 'organizations-module-api')
  userAppStore.HTML.renderList(doc, sitemap['@userappstore/stripe-subscriptions'].web, 'url-data', 'subscriptions-module-pages')
  userAppStore.HTML.renderList(doc, sitemap['@userappstore/stripe-subscriptions'].api, 'url-data', 'subscriptions-module-api')
  userAppStore.HTML.renderList(doc, sitemap['@userappstore/stripe-connect'].web, 'url-data', 'connect-module-pages')
  userAppStore.HTML.renderList(doc, sitemap['@userappstore/stripe-connect'].api, 'url-data', 'connect-module-api')
  // userAppStore.HTML.renderList(doc, sitemap['dashboard-server'].web, 'url-data', 'dashboard-server-pages')
  userAppStore.HTML.renderList(doc, sitemap['dashboard-server'].api, 'url-data', 'dashboard-server-api')
  userAppStore.HTML.renderList(doc, sitemap['application-server'].web, 'url-data', 'application-server-pages')
  userAppStore.HTML.renderList(doc, sitemap['application-server'].api, 'url-data', 'application-server-api')
  return res.end(doc.toString())
}
