// The UserAppStore application server receives requests from
// the Dashboard server and verifies their authenticity, then
// passes the request to the corresponding route or file
const API = require('./src/api.js')
const bcrypt = require('bcrypt-node')
const crypto = require('crypto')
const fs = require('fs')
const http = require('http')
const path = require('path')
const qs = require('querystring')
const Sitemap = require('./src/sitemap.js')
const Timestamp = require('./src/timestamp.js')
const url = require('url')
const util = require('util')

global.rootPath = path.join(__dirname, `src/www`)
global.storagePath = process.env.STORAGE_PATH || path.join(__dirname, 'data')
global.applicationPath = __dirname
global.stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY
global.pageSize = 100

const eightDays = 8 * 24 * 60 * 60 * 1000
const eTags = {}
const files = {}
const mimeTypes = {
  js: 'text/javascript',
  json: 'application/javascript',
  css: 'text/css',
  txt: 'text/plain',
  html: 'text/html',
  jpg: 'image/jpeg',
  png: 'image/png',
  ico: 'image/x-icon',
  svg: 'image/svg+xml'
}

let server

async function start () {
  global.sitemap = Sitemap.generate()
  global.api = API.generate()
  server = http.createServer(receiveRequest)
  return server.listen(process.env.PORT || 8001, process.env.IP || '127.0.0.1')
}

async function stop() {
  server.close()
  server = null
  clearInterval(Timestamp.interval)
  Timestamp.interval = null
}

module.exports = {
  start,
  stop
}

if(process.env.NODE_ENV !== 'testing') {
  start() 
}

async function receiveRequest (req, res) {
  res.statusCode = 200
  // confirm it came from the Dashboard server
  if (req.headers['x-dashboard-server'] === process.env.DASHBOARD_SERVER) {
    if (!req.headers['x-accountid']) {
      // guest accessing something
      req.dashboardServer = true
    } else {
      // user is signed in
      const token = req.headers['x-dashboard-token']
      const accountid = req.headers['x-accountid']
      const sessionid = req.headers['x-sessionid']
      const expected = `${process.env.APPLICATION_SERVER_TOKEN}:${accountid}:${sessionid}`
      if (bcrypt.compareSync(expected, token)) {
        req.dashboardServer = true
        req.account = { accountid }
        req.session = { sessionid }
      }
    }
  }
  if (!req.dashboardServer) {
    res.statusCode = 404
    return res.end()
  }
  let urlPath = req.url.split('?')[0]
  // serve public files
  if (urlPath.startsWith('/public/')) {
    const extension = urlPath.split('.').pop()
    if (!mimeTypes[extension]) {
      res.statusCode = 404
      return res.end()
    }
    const filePath = `${global.rootPath}${urlPath}`
    if (!fs.existsSync(filePath)) {
      res.statusCode = 404
      return res.end()
    }
    const blob = files[urlPath] = files[urlPath] || fs.readFileSync(filePath)
    let eTag = eTags[urlPath]
    if (!eTag) {
      if (blob.length === 0) {
        eTag = '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"'
      } else {
        const hash = crypto.createHash('sha1').update(blob, 'utf-8').digest('base64').replace(/=+$/, '')
        eTag = eTags[urlPath] = '"' + blob.length.toString(16) + '-' + hash + '"'
      }
      eTags[urlPath] = eTag
    }
    res.setHeader('expires', new Date(Date.now() + eightDays).toUTCString())
    res.setHeader('etag', eTag)
    res.setHeader('vary', 'accept-encoding')
    res.setHeader('content-type', mimeTypes[extension])
    return res.end(blob, 'binary')
  }
  // parse query string
  req.query = url.parse(req.url, true).query
  // remap project preview paths
  if (urlPath.startsWith('/project/')) {
    const parts = urlPath.split('/')
    if (parts[3] !== 'public') {
      urlPath = '/project/' + parts[3]
    } else {
      urlPath = '/project/public/' + parts[4]
    }
    req.url = `${urlPath}?projectid=` + parts[parts.length - 1]
    req.query = req.query || {}
    req.query.projectid = parts[2]
  }
  // remap opened app paths
  if (urlPath.startsWith('/install/')) {
    const parts = urlPath.split('/')
    urlPath = '/install/' + parts[3]
    req.url = '/install/' + parts[3] + '?installid=' + parts[2]
    req.query = req.query || {}
    req.query.installid = parts[2]
  }
  // load up the route files
  req.route = global.sitemap[urlPath]
  if (!req.route) {
    res.statusCode = 404
    return res.end()
  }
  if (req.route.html) {
    res.setHeader('content-type', mimeTypes.html)
  }
  if (!req.route.api) {
    res.statusCode = 404
    return res.end()
  }
  if (!req.account && req.route.auth !== false) {
    res.statusCode = 511
    return res.end()
  }
  const administratorRoute = urlPath.startsWith('/api/administrator/') ||
                             urlPath.startsWith('/administrator/')
  if (!req.administrator && administratorRoute) {
    res.statusCode = 511
    return res.end()
  }
  if (req.route.api === 'static-page') {
    return res.end(req.route.html)
  }
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTION') {
    await parseBody(req, res)
  }
  const handler = req.route.api[req.method.toLowerCase()]
  if (!handler) {
    res.statusCode = 404
    return res.end()
  }
  try {
    return handler(req, res)
  } catch (error) {
    res.statusCode = 500
    return res.end()
  }
}

const parseBody = util.promisify((req, res, callback) => {
  if (!req.headers['content-length']) {
    return callback()
  }
  if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data')) {
    return callback()
  }
  let body = ''
  req.on('data', (data) => {
    body += data
  })
  return req.on('end', () => {
    if (body) {
      req.bodyRaw = body
      req.body = qs.parse(body)
    }
    return callback()
  })
})
