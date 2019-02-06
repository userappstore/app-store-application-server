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
    for (const url in dashboard) {
      const origin = dashboard[url]
      sitemap[origin] = sitemap[origin] || {
        web: [],
        api: []
      }
      if (url.startsWith('/api/')) {
        sitemap[origin].api.push({ url })
      } else {
        if (url === '/') {
          sitemap[origin].web.unshift({ url, object })
        } else {
          sitemap[origin].web.push({ url, object })  
        }
      }
    }
  }
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
