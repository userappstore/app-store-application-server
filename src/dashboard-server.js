const bcrypt = require('bcrypt-node')
const http = require('http')
const https = require('https')
const querystring = require('querystring')
const util = require('util')

module.exports = {
  get: async (path, accountid, sessionid) => {
    return proxy('GET', path, null, accountid, sessionid)
  },
  post: async (path, body, accountid, sessionid) => {
    return proxy('POST', path, body, accountid, sessionid)
  },
  patch: async (path, body, accountid, sessionid) => {
    return proxy('PATCH', path, body, accountid, sessionid)
  },
  delete: async (path, body, accountid, sessionid) => {
    return proxy('DELETE', path, body, accountid, sessionid)
  }
}

const proxy = util.promisify((method, path, data, accountid, sessionid, callback) => {
  if (process.env.NODE_ENV === 'testing' && global.testResponse) {
    if (global.testResponse[path]) {
      return callback(null, global.testResponse[path])
    } else {
      throw new Error('invalid url ' + path)
    }
  }
  const baseURLParts = process.env.DASHBOARD_SERVER.split('://')
  let host, port
  const colon = baseURLParts[1].indexOf(':')
  if (colon > -1) {
    port = baseURLParts[1].substring(colon + 1)
    host = baseURLParts[1].substring(0, colon)
  } else if (baseURLParts[0] === 'https') {
    port = 443
    host = baseURLParts[1]
  } else if (baseURLParts[0] === 'http') {
    port = 80
    host = baseURLParts[1]
  }
  const salt = bcrypt.genSaltSync(1)
  const token = bcrypt.hashSync(`${process.env.APPLICATION_SERVER_TOKEN}:${accountid}:${sessionid}`, salt)
  const requestOptions = {
    host,
    path,
    port,
    method,
    headers: {
      'x-application': process.env.APPLICATION_SERVER,
      'x-token': token,
      'x-accountid': accountid,
      'x-sessionid': sessionid
    }
  }
  const protocol = baseURLParts[0] === 'https' ? https : http
  const proxyRequest = protocol.request(requestOptions, (proxyResponse) => {
    let body = ''
    proxyResponse.on('data', (chunk) => {
      body += chunk
    })
    return proxyResponse.on('end', () => {
      if (!body) {
        return callback()
      }
      if (proxyResponse.statusCode === 200) {
        return callback(null, JSON.parse(body))
      }
      if (body && proxyResponse.headers['content-type'] === 'application/json') {
        body = JSON.parse(body)
        return callback(new Error(body.error))
      }
      return callback(new Error('dashboard-error'))
    })
  })
  proxyRequest.on('error', (error) => {
    return callback(error)
  })
  if (data) {
    proxyRequest.write(querystring.stringify(data))
  }
  return proxyRequest.end()
})
