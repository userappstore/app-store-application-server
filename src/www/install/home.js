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
  const install = await global.api.user.userappstore.Install.get(req)
  req.data = { install, installs }
  if (install.projectid) {
    req.query.projectid = install.projectid
    const project = await global.api.user.userappstore.InstalledProject.get(req)
    const files = await global.api.user.userappstore.InstalledProjectFiles.get(req)
    req.data.files = files
    req.data.project = project
  } else if (install.appid) {
    req.query.appid = install.appid
    const app = await global.api.user.userappstore.InstalledApp.get(req)
    req.data.app = app
  } else if (install.url) {
    req.data.url = install.url
  }
  req.data.app = {
    object: 'app',
    user: {
      sessionid: req.session.sessionid,
      profileid: req.account.profileid,
      url: `${process.env.DASHBOARD_SERVER}/install/${req.query.installid}/home`,
      root: `${process.env.DASHBOARD_SERVER}/install/${req.query.installid}/`
    }
  }
}
async function renderPage (req, res) {
  let appDoc
  if (req.data.project) {
    try {
      appDoc = await renderProject(req, res)
    } catch (error) {
      projectErrorHTML = projectErrorHTML || fs.readFileSync(path.join(__dirname, 'app-error.html').toString())
      appDoc = userAppStore.HTML.parse(projectErrorHTML)
    }
  }
  // add the app navigation and head script
  const doc = userAppStore.HTML.parse(req.route.html, req.data.app, 'app')
  const navbar = doc.getElementById('navbar')
  userAppStore.HTML.renderList(doc, req.data.installs, 'navigation-link', navbar)
  const head = doc.getElementById('head')
  const userScript = doc.getElementById('user')
  head.child = [userScript]
  appDoc.child = appDoc.child || []
  appDoc.appendChild(navbar)
  appDoc.appendChild(head)
  return res.end(appDoc.toString())
}

async function renderProject (req, res) {
  let project
  if (req.data.files['home.html'] && req.data.files['home.html'].length) {
    try {
      project = userAppStore.HTML.parse(req.data.files['home.html'])
    } catch (error) {
    }
  }
  project = project || userAppStore.HTML.parse(`<html><body></body></html>`)
  return project
}
