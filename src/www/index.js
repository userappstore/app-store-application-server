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
    let i = 0
    for (const url in dashboard) {
      const route = dashboard[url]
      route.id = i++
      route.object = 'route'
      route.url = url
      sitemap[route.origin] = sitemap[route.origin] || {
        webAdministrator: [],
        webUser: [],
        apiAdministrator: [],
        apiUser: []
      }
      const repo = route.origin.substring(1)
      let githubNodeJSURL, githubHTMLURL, githubTestURL
      if (route.nodejs) {
        route.githubNodeJSURL = `https://github.com/${repo}/blob/master/src/www${url}.js`
      }
      if (route.html) {
        route.githubHTMLURL = `https://github.com/${repo}/blob/master/src/www${url}.html`
      }
      if (route.test) {
        route.githubTestURL = `https://github.com/${repo}/blob/master/src/www${url}.test.js`
      }
      if (url.startsWith('/api/')) {
        if (url.startsWith('/api/user/')) {
          sitemap[route.origin].apiUser.push(route)
        } else {
          sitemap[route.origin].apiAdministrator.push(route)
        }
        continue
      }
      if (roots.indexOf(url) > 1) {
        if (url.startsWith('/administrator')) {
          sitemap[route.origin].webAdministrator.unshift(route)
        } else {
          sitemap[route.origin].webUser.unshift(route)
        }
      } else { 
        if (url.startsWith('/administrator')) {
          sitemap[route.origin].webAdministrator.push(route)  
        } else {
          sitemap[route.origin].webUser.push(route)
        }
      }
    }
  }
  sitemap['@userappstore/dashboard'].web = sitemap['@userappstore/dashboard'].webUser.concat(sitemap['@userappstore/dashboard'].webAdministrator)
  sitemap['@userappstore/dashboard'].api = sitemap['@userappstore/dashboard'].apiUser.concat(sitemap['@userappstore/dashboard'].apiAdministrator)
  sitemap['@userappstore/organizations'].web = sitemap['@userappstore/organizations'].webUser.concat(sitemap['@userappstore/organizations'].webAdministrator)
  sitemap['@userappstore/organizations'].api = sitemap['@userappstore/organizations'].apiUser.concat(sitemap['@userappstore/organizations'].apiAdministrator)
  sitemap['@userappstore/stripe-subscriptions'].web = sitemap['@userappstore/stripe-subscriptions'].webUser.concat(sitemap['@userappstore/stripe-subscriptions'].webAdministrator)
  sitemap['@userappstore/stripe-subscriptions'].api = sitemap['@userappstore/stripe-subscriptions'].apiUser.concat(sitemap['@userappstore/stripe-subscriptions'].apiAdministrator)
  sitemap['@userappstore/stripe-connect'].web = sitemap['@userappstore/stripe-connect'].webUser.concat(sitemap['@userappstore/stripe-connect'].webAdministrator)
  sitemap['@userappstore/stripe-connect'].api = sitemap['@userappstore/stripe-connect'].apiUser.concat(sitemap['@userappstore/stripe-connect'].apiAdministrator)
  // sitemap['application-server'].web = sitemap['application-server'].webUser.concat(sitemap['application-server'].webAdministrator)
  // sitemap['application-server'].api = sitemap['application-server'].apiUser.concat(sitemap['application-server'].apiAdministrator)
  // sitemap['dashboard-server'].web = sitemap['dashboard-server'].webUser.concat(sitemap['dashboard-server'].webAdministrator)
  // sitemap['dashboard-server'].api = sitemap['dashboard-server'].apiUser.concat(sitemap['dashboard-server'].apiAdministrator)
  userAppStore.HTML.renderList(doc, sitemap['@userappstore/dashboard'].web, 'page-data', 'dashboard-pages')
  userAppStore.HTML.renderList(doc, sitemap['@userappstore/dashboard'].api, 'api-data', 'dashboard-api')
  userAppStore.HTML.renderList(doc, sitemap['@userappstore/organizations'].web, 'page-data', 'organizations-module-pages')
  userAppStore.HTML.renderList(doc, sitemap['@userappstore/organizations'].api, 'api-data', 'organizations-module-api')
  userAppStore.HTML.renderList(doc, sitemap['@userappstore/stripe-subscriptions'].web, 'page-data', 'subscriptions-module-pages')
  userAppStore.HTML.renderList(doc, sitemap['@userappstore/stripe-subscriptions'].api, 'api-data', 'subscriptions-module-api')
  userAppStore.HTML.renderList(doc, sitemap['@userappstore/stripe-connect'].web, 'page-data', 'connect-module-pages')
  userAppStore.HTML.renderList(doc, sitemap['@userappstore/stripe-connect'].api, 'api-data', 'connect-module-api')
  // userAppStore.HTML.renderList(doc, sitemap['dashboard-server'].web, 'url-data', 'dashboard-server-pages')
  // userAppStore.HTML.renderList(doc, sitemap['dashboard-server'].api, 'url-data', 'dashboard-server-api')
  // userAppStore.HTML.renderList(doc, sitemap['application-server'].web, 'url-data', 'application-server-pages')
  // userAppStore.HTML.renderList(doc, sitemap['application-server'].api, 'url-data', 'application-server-api')
  const removeLinks = []
  for (const route of sitemap) {
    if (!route.html) {
      removeLinks.push(`html-${route.id}`)
    }
    if (!route.js) {
      removeLinks.push(`nodejs-${route.id}`)
    }
    if (!route.test) {
      removeLinks.push(`test-${route.id}`)
    }
  }
  for (const id of removeLinks) {
    const link = doc.getElementById(id)
    link.parentNode.removeChild(link)
  }
  return res.end(doc.toString())
}
