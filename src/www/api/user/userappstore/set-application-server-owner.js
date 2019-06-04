const bcrypt = require('../../../../bcrypt.js')
const https = require('https')
const userAppStore = require('../../../../../index.js')
const util = require('util')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.serverid) {
      throw new Error('invalid-application-serverid')
    }
    const server = await global.api.user.userappstore.ApplicationServer.get(req)
    if (!server || server.ownerid) {
      throw new Error('invalid-server')
    }
    const token = `${server.applicationServer}/${req.account.accountid}/${req.session.sessionid}`
    const url = `${server.applicationServer}/authorized-app-stores/${process.env.DASHBOARD_SERVER.split('://')[1]}.txt`
    const urlContents = await fetch(url)
    const match = await bcrypt.compare(token, urlContents)
    if (!match) {
      throw new Error('invalid-verification-token')
    }
    server.ownerid = req.body.accountid
    server.claimed = userAppStore.Timestamp.now
    await userAppStore.Storage.write(`server/${server.serverid}`, server)
    await userAppStore.StorageList.add(`account/servers/${req.account.accountid}`, server.serverid)
    req.success = true
    return server
  }
}

const fetch = util.promisify((url, callback) => {
  let baseURL = url.split('://')[1]
  const baseSlash = baseURL.indexOf('/')
  if (baseSlash > -1) {
    baseURL = baseURL.substring(0, baseSlash)
  }
  let port = 443
  const colon = baseURL.indexOf(':')
  if (colon > -1) {
    port = baseURL.substring(colon + 1)
    baseURL = baseURL.substring(0, colon)
  }
  const path = url.substring(url.indexOf('://') + 3 + baseURL.length)

  const requestOptions = {
    host: baseURL,
    path: path,
    port: port,
    method: 'GET',
    headers: {
      'x-dashboard-server': process.env.DASHBOARD_SERVER
    }
  }
  const req = https.request(requestOptions, (proxyResponse) => {
    let body
    proxyResponse.on('data', (chunk) => {
      body = body ? Buffer.concat([chunk, body]) : chunk
    })
    proxyResponse.on('end', () => {
      return callback(null, body.toString('utf-8'))
    })
    proxyResponse.on('error', (error) => {
      return callback(error)
    })
  })
  req.on('error', (error) => {
    return callback(error)
  })
  return req.end()
})