// The UserAppStore application server receives requests from
// the Dashboard server and verifies their authenticity, then
// passes the request to the corresponding route or file
const bcrypt = require('./bcrypt.js')
const crypto = require('crypto')
const dashboardServer = process.env.DASHBOARD_SERVER.split('://')[1]
const fs = require('fs')
const http = require('http')
const Multiparty = require('multiparty')
const qs = require('querystring')
const url = require('url')
const util = require('util')

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

module.exports = {
  start: async () => {
    server = http.createServer(receiveRequest)
    return server.listen(process.env.PORT || 8001, process.env.IP || '127.0.0.1')
  },
  stop: async() => {
    if (server) {
      server.close()
      server = null
    }
  }
}

async function receiveRequest(req, res) {
  if (process.env.DEBUG_ERRORS) {
    console.log('[request]', req.method, req.url, dashboardServer)
  }
  res.statusCode = 200
  // confirm it came from the Dashboard server
  if (req.headers['x-dashboard-server'] === dashboardServer) {
    if (!req.headers['x-accountid']) {
      // guest accessing something
      const token = req.headers['x-dashboard-token']
      const expected = process.env.APPLICATION_SERVER_TOKEN
      req.dashboardServer = await bcrypt.compare(expected, token)
    } else {
      // user is signed in
      const token = req.headers['x-dashboard-token']
      const accountid = req.headers['x-accountid']
      const sessionid = req.headers['x-sessionid']
      const expected = `${process.env.APPLICATION_SERVER_TOKEN}/${accountid}/${sessionid}`
      req.dashboardServer = await bcrypt.compare(expected, token)
      if (req.dashboardServer) {
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
  req.urlPath = req.url.split('?')[0]
  // serve public files
  if (req.urlPath.startsWith('/public/') || req.urlPath === '/favicon.ico') {
    const extension = req.urlPath.split('.').pop()
    if (!mimeTypes[extension]) {
      res.statusCode = 404
      return res.end()
    }
    let filePath = `${global.rootPath}/src/www${req.urlPath}`
    if (!fs.existsSync(filePath)) {
      filePath = `${global.rootPath}/node_modules/@userappstore/app-store-application-server/src/www${req.urlPath}`
    }
    if (!fs.existsSync(filePath)) {
      res.statusCode = 404
      return res.end()
    }
    const blob = files[req.urlPath] = files[req.urlPath] || fs.readFileSync(filePath)
    let eTag = eTags[req.urlPath]
    if (!eTag) {
      if (blob.length === 0) {
        eTag = '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"'
      } else {
        const hash = crypto.createHash('sha1').update(blob, 'utf-8').digest('base64').replace(/=+$/, '')
        eTag = eTags[req.urlPath] = '"' + blob.length.toString(16) + '-' + hash + '"'
      }
      eTags[req.urlPath] = eTag
    }
    if (req.headers['if-none-match'] === eTag) {
      res.statusCode = 304
      return res.end()
    }
    res.setHeader('expires', new Date(Date.now() + eightDays).toUTCString())
    res.setHeader('etag', eTag)
    res.setHeader('vary', 'accept-encoding')
    res.setHeader('content-type', mimeTypes[extension])
    return res.end(blob, 'binary')
  }
  req.query = url.parse(req.url, true).query
  req.route = global.sitemap[req.urlPath]
  if (!req.route) {
    res.statusCode = 404
    return res.end()
  }
  if (req.route.html) {
    res.setHeader('content-type', mimeTypes.html)
  }
  if (!req.route.api) {
    if (req.route.html) {
      return res.end(req.route.html)
    }
    res.statusCode = 404
    return res.end()
  }
  if (!req.account && req.route.auth !== false) {
    res.statusCode = 511
    return res.end()
  }
  const administratorRoute = req.urlPath.startsWith('/api/administrator/') ||
    req.urlPath.startsWith('/administrator/')
  if (!req.administrator && administratorRoute) {
    res.statusCode = 511
    return res.end()
  }
  if (req.route.api === 'static-page') {
    return res.end(req.route.html)
  }
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTION') {
    try {
      req.bodyRaw = await parseBody(req)
    } catch (error) {
    }
    if (req.bodyRaw) {
      req.body = qs.parse(req.bodyRaw)
    } else {
      try {
        await parseMultiPartData(req)
      } catch (error) {
      }
    }
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

const parseBody = util.promisify((req, callback) => {
  if (req.headers['content-length'] && req.headers['content-length'] > 2000000) {
    return callback(new Error('invalid-post-size'))
  }
  // todo: content length limit and type restrictions
  if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data')) {
    return callback()
  }
  let raw
  req.on('data', (chunk) => {
    raw = raw ? Buffer.concat([raw, chunk]) : chunk
    if (raw.length > 2000000) {
      return
    }
  })
  return req.on('end', () => {
    if (raw) {
      return callback(null, raw.toString('utf-8'))
    }
    return callback()
  })
})

const parseMultiPartData = util.promisify((req, callback) => {
  const form = new Multiparty.Form()
  return form.parse(req, async (error, fields, files) => {
    if (error) {
      return callback(error)
    }
    req.body = {}
    for (const field in fields) {
      req.body[field] = fields[field][0]
    }
    req.uploads = {}
    for (const filename in files) {
      const file = files[filename][0]
      const extension = file.originalFilename.toLowerCase().split('.').pop()
      const type = extension === 'png' ? 'image/png' : 'image/jpeg'
      req.uploads[filename] = {
        type,
        buffer: fs.readFileSync(file.path),
        name: filename
      }
      fs.unlinkSync(file.path)
    }
    return callback()
  })
})