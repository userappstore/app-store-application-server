/* eslint-env mocha */
const fs = require('fs')
const HTML = require('./src/html.js')
const Main = require('./main.js')
const path = require('path')
const url = require('url')
const util = require('util')
const UUID = require('./src/uuid.js')

process.env.NODE_ENV = 'testing'
process.env.PORT = 8889
process.env.IP = 'localhost'
global.testNumber = 0
global.rootPath = path.join(__dirname, `src/www`)
global.applicationPath = __dirname

module.exports = {
  addCollectionItem,
  createApp,
  createCollection,
  createInstall,
  createRequest,
  createResponse,
  createProject,
  createUser,
  deleteInstall,
  extractDoc,
  wait: util.promisify(wait)
}

before(async () => {
  await Main.start()
})

after(async () => {
  await Main.stop()
})

beforeEach(async () => {
  global.pageSize = 2
  global.testNumber++
  global.testResponse = null
  if (!process.env.STORAGE_ENGINE) {
   deleteLocalData(global.storagePath)
    fs.mkdirSync(global.storagePath)
  }
})

afterEach(async () => {
  if (!process.env.STORAGE_ENGINE) {
   deleteLocalData(global.storagePath)
  }
})

let accountNumber = 0
async function createUser () {
  return {
    account: { accountid: `account_${UUID.random(16)}` },
    session: { sessionid: `session_${UUID.random(16)}` },
    profile: { profileid: `profile_${UUID.random(16)}`, email: `account${accountNumber++}@email.com`}
  }
}

async function createApp(user, appInfo) {
  const req = createRequest(`/api/user/userappstore/create-app?accountid=${user.account.accountid}`, 'POST')
  req.account = user.account
  req.session = user.session
  req.body = appInfo
  user.app = await req.route.api.post(req)
  if (appInfo.published) {
    const req2 = createRequest(`/api/user/userappstore/set-app-published?appid=${user.app.appid}`, 'PATCH')
    req2.account = req.account
    req2.session = req.session
    user.app = await req2.route.api.patch(req2)
    if (appInfo.unpublished) {
      const req3 = createRequest(`/api/user/userappstore/set-app-unpublished?appid=${user.app.appid}`, 'PATCH')
      req3.account = req2.account
      req3.session = req2.session
      user.app = await req3.route.api.patch(req3)
    }
  }
  return user.app
}

async function deleteInstall (user, installid) {
  const req = createRequest(`/api/user/userappstore/delete-install?installid=${installid}`, 'DELETE')
  req.account = user.account
  req.session = user.session
  user.app = await req.route.api.delete(req)
  return user.app
}

async function createCollection (user) {
  const req = createRequest(`/api/user/userappstore/create-collection?accountid=${user.account.accountid}`, 'POST')
  req.account = user.account
  req.session = user.session
  req.body = {
    name: 'Collection',
    text: '#FFFFFF',
    background: '#000000'
  }
  user.collection = await req.route.api.post(req)
  return user.collection
}

async function createInstall(user, installInfo) {
  let url = `/api/user/userappstore/create-install?accountid=${user.account.accountid}`
  if (installInfo && installInfo.appid) {
    url += `&appid=${installInfo.appid}`
  }
  const req = createRequest(url, 'POST')
  req.account = user.account
  req.session = user.session
  req.body = installInfo || { url: 'https://something' }
  user.install = await req.route.api.post(req)
  return user.install
}

async function addCollectionItem (user, collection, install) {
  const req = createRequest(`/api/user/userappstore/add-collection-install?collectionid=${collection.collectionid}`, 'POST')
  req.account = user.account
  req.session = user.session
  req.body = {
    installid: install.installid
  }
  user.app = await req.route.api.post(req)
  return user.app  
}

let projectCounter = 0
async function createProject (user, projectInfo) {
  const req = createRequest(`/api/user/userappstore/create-project?accountid=${user.account.accountid}`, 'POST')
  req.account = user.account
  req.session = user.session
  req.body = projectInfo || {}
  req.body.projectid = req.body.projectid || `project-${projectCounter++}`
  user.project = await req.route.api.post(req)
  if (projectInfo && projectInfo.shared) {
    const req2 = createRequest(`/api/user/userappstore/set-project-shared?projectid=${user.project.projectid}`, 'PATCH')
    req2.account = req.account
    req2.session = req.session
    user.project = await req2.route.api.patch(req2)
  }
  return user.project
}

function createRequest (rawURL, method) {
  const req = {
    state: 'route',
    method: method.toUpperCase(),
    url: rawURL,
    urlPath: rawURL.split('?')[0],
    headers: {
      'User-Agent': 'Integration tests'
    },
    ip: '1.2.3.4',
    userAgent: 'Integration test'
  }
  if (rawURL.indexOf('?') > -1) {
    req.query = url.parse(rawURL, true).query
  }
  req.route = global.sitemap[req.urlPath]
  return req
}

function createResponse () {
  const headers = {}
  return {
    headers,
    statusCode: 0,
    setHeader: (name, value) => {
      headers[name] = value
    }
  }
}

function wait (callback) {
  return setTimeout(callback, 1000)
}

function extractDoc (html) {
  return HTML.parse(html)
}

// via https://stackoverflow.com/questions/18052762/remove-directory-which-is-not-empty
function deleteLocalData (currentPath) {
  if (!fs.existsSync(currentPath)) {
    return
  }
  const contents = fs.readdirSync(currentPath)
  for (const item of contents) {
    var itemPath = `${currentPath}/${item}`
    const stat = fs.lstatSync(itemPath)
    if (stat.isDirectory()) {
      deleteLocalData(itemPath)
    } else {
      fs.unlinkSync(itemPath)
    }
  }
  fs.rmdirSync(currentPath)
}