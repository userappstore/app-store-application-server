const http = require('http')
const https = require('https')
const util = require('util')

module.exports = {
  dashboard: util.promisify(pass)
}

function pass (method, path, accountid, sessionid, callback) {
  let baseURL = process.env.DASHBOARD_SERVER.split('://')[1]
  const baseSlash = baseURL.indexOf('/')
  if (baseSlash > -1) {
    baseURL = baseURL.substring(0, baseSlash)
  }
  let port = 80
  const colon = baseURL.indexOf(':')
  if (colon > -1) {
    port = baseURL.substring(colon + 1)
    baseURL = baseURL.substring(0, colon)
  }
  const requestOptions = {
    host: baseURL,
    path: path,
    method: method,
    headers: {
      'x-application-server-token': process.env.APPLICATION_SERVER_TOKEN,
      'x-accountid': accountid,
      'x-sessionid': sessionid,
      'referer': process.env.APPLICATION_SERVER
    }
  }
  const protocol = process.env.DASHBOARD_SERVER.startsWith('https') ? https : http
  if (protocol === https) {
    requestOptions.port = 443
  } else {
    requestOptions.port = port
  }
  return protocol.request(requestOptions, (proxyResponse) => {
    let body = ''
    proxyResponse.on('data', (chunk) => {
      body += chunk
    })
    proxyResponse.on('end', () => {
      return callback(null, JSON.parse(body))
    })
    proxyResponse.on('error', (error) => {
      return callback(error)
    })
  })
}
