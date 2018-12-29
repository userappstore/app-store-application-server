const fs = require('fs')
const path = require('path')
const userAppStore = require('../../../index.js')
let projectErrorHTML

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.installid) {
    throw new Error('invalid-installid')
  }
  req.query.accountid = req.account.accountid
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
  } else if (install.url) {
    req.data.url = install.url
  }
  req.data.installInfo = {
    object: 'install',
    user: {
      sessionid: req.session.sessionid,
      profileid: req.account.profileid,
      url: `${process.env.DASHBOARD_SERVER}/install/${req.query.installid}/home`,
      root: `${process.env.DASHBOARD_SERVER}/install/${req.query.installid}/`
    }
  }
}
async function renderPage (req, res) {
  let doc
  // rendering a project requires substituting root links
  // for their install-specific URLs
  if (req.data.project) {
    let projectHTML
    if (req.data.files['home.html'] && req.data.files['home.html'].length) {
      try {
        projectHTML = req.data.files['home.html']
      } catch (error) {
        projectHTML = projectErrorHTML = projectErrorHTML || fs.readFileSync(path.join(__dirname, 'project-error.html').toString())
      }
    }
    projectHTML = projectHTML.split('/home').join(`/project/${req.data.project.projectid}/home`)
    projectHTML = projectHTML.split('/public/app.js').join(`/project/${req.data.project.projectid}/public/app.js`)
    projectHTML = projectHTML.split('/public/app.css').join(`/project/${req.data.project.projectid}/public/app.css`)
    try {
      doc = userAppStore.HTML.parse(projectHTML)
    } catch (error) {
      projectHTML = projectErrorHTML = projectErrorHTML || fs.readFileSync(path.join(__dirname, 'project-error.html').toString())
      doc = userAppStore.HTML.parse(projectHTML)
    }
  } else if (req.data.installedApp) {

  } else {

  }
  if (!doc) {
    throw new Error('invalid-install')
  }
  // The project's <template id="navbar" /> conflicts with the page
  // so the project one gets renamed to app-navbar, and then the
  // Dashboard places that in a secondary navigation found in
  // UserAppStore's template.  When a project is exported it will
  // stay named navbar and use the Dashboard template's navigation.
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
