const dashboardServer = require('../../dashboard-server.js')
const fs = require('fs')
const path = require('path')
const querystring = require('querystring')
const userAppStore = require('../../../index.js')
let projectErrorHTML, proxyErrorHTML

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.installid) {
    throw new Error('invalid-installid')
  }
  // all of the installs are required for the menu so instead of
  // loading the specified install it is found amongst them 
  req.query.accountid = req.account.accountid
  req.query.all = true
  const installs = await global.api.user.userappstore.Installs.get(req)
  if (!installs || !installs.length) {
    throw new Error('invalid-installid')
  }
  let install
  for (const item of installs) {
    if (item.installid === req.query.installid) {
      install = item
      break
    }
  }
  if (!install) {
    throw new Error('invalid-installid')
  }
  // all of the users collections are required for the menu too
  let collection, ungrouped
  if (install.collectionid) {
    req.query.collectionid = install.collectionid
    collection = await global.api.user.userappstore.Collection.get(req)
  } else {
    ungrouped = []
    for (const item of installs) {
      if (!item.collectionid) {
        ungrouped.push(item)
      }
    }
  }
  const menu = collection ? collection.items : ungrouped
  req.data = { install, menu }
  if (install.projectid) {
    req.query.projectid = install.projectid
    const project = await global.api.user.userappstore.InstalledProject.get(req)
    const files = await global.api.user.userappstore.InstalledProjectFiles.get(req)
    req.data.files = files
    req.data.project = project
  } else if (install.appid) {
    req.query.appid = install.appid
    const installedApp = await global.api.user.userappstore.InstalledApp.get(req)
    req.data.installedApp = installedApp
    if (installedApp.projectid) {
      req.query.projectid = installedApp.projectid
      const project = await global.api.user.userappstore.SharedProject.get(req)
      const files = await global.api.user.userappstore.SharedProjectFiles.get(req)
      req.data.files = files
      req.data.project = project
    }
  } else if (install.url) {
    req.data.url = install.url
  }
}

async function renderPage (req, res) {
  let doc
  // rendering a project requires substituting root links
  // for their install-specific URLs
  if (req.data.project) {
    let projectHTML = req.data.files['home.html'] || '<html><head></head><body></body></html>'
    projectHTML = projectHTML.split('/home').join(`/install/${req.query.installid}/home`)
    projectHTML = projectHTML.split('/public/app.js').join(`/install/${req.query.installid}/public/app.js`)
    projectHTML = projectHTML.split('/public/app.css').join(`/install/${req.query.installid}/public/app.css`)
    try {
      doc = userAppStore.HTML.parse(projectHTML)
    } catch (error) {
      projectHTML = projectErrorHTML = projectErrorHTML || fs.readFileSync(path.join(__dirname, 'project-error.html')).toString('utf-8')
      doc = userAppStore.HTML.parse(projectHTML)
    }
  } else if (req.data.install.serverid) {
    // proxy the application server and substitute root links
    // for their install-specific URLs
    let proxiedHTML
    let proxyURL = req.urlPath.substring(`/install`.length)
    delete (req.query.installid)
    proxyURL += '?' + querystring.stringify(req.query)
    if (req.method === 'GET') {
      proxiedHTML = await dashboardServer.get(proxyURL, req.data.accountid, req.data.sessionid, req.data.server.applicationServer, req.data.server.applicationServerToken)
    } else {
      const method = req.method.toLowerCase()
      proxiedHTML = await dashboardServer[method](proxyURL, req.body, req.data.accountid, req.data.sessionid, req.data.server.applicationServer, req.data.server.applicationServerToken)
    }
    try {
      if (proxiedHTML) {
        doc = userAppStore.HTML.parse(proxiedHTML)
      }
    } catch (error) {
    }
    if (!doc) {
      proxiedHTML = proxyErrorHTML = proxyErrorHTML || fs.readFileSync(path.join(__dirname, 'proxy-error.html')).toString('utf-8')
      doc = userAppStore.HTML.parse(proxiedHTML)
    }
  } else {
    // iframe the url
    doc = userAppStore.HTML.parse(req.route.html, req.data.install, 'install')
  }
  if (!doc) {
    throw new Error('invalid-install')
  }
  if (!req.data.install.url) {
    // The project or server <template id="navbar" /> conflicts with the page
    // so it gets renamed to app-navbar, and then in the UserAppStore Dashboard 
    // it gets placed in a secondary navigation in the template.  This allows
    // projects and application servers to work under the assumption that
    // home is /home even when it's /install/installid/home
    const installNavbar = doc.getElementById('navbar')
    if (installNavbar) {
      installNavbar.attr.id = 'app-navbar'
    }
    // The project's <template id="head" /> can't be used on
    // UserAppStore because it adds HTML to the <head> of the
    // template, so it's renamed to exclude it.  When a project
    // is exported you can use that tag to add to your template.
    const installHead = doc.getElementById('head')
    if (installHead) {
      installNavbar.attr.id = 'app-head'
    }
  }
  // add the ungrouped or collection items to the primary navigation
  const template = doc.createElement('template')
  template.attr = { id: 'navbar' }
  for (const item of req.data.menu) {
    const link = doc.createElement('a')
    link.attr = { href: `/install/${item.installid}/home` }
    link.child = [{
      node: 'text',
      text: item.text
    }]
    template.appendChild(link)
  }
  doc.appendChild(template)
  res.setHeader('content-type', 'text/html')
  return res.end(doc.toString())
}
