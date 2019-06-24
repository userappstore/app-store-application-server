// The project application server receives requests from
// the Dashboard server and verifies their authenticity, then
// passes the request to the corresponding route or file
//
// Initially the only routes are from your project but you
// can add more in `src/www`
const bcrypt = require('./src/bcrypt.js')
const fs = require('fs')
const http = require('http')
const path = require('path')

const server = http.createServer(receiveRequest)
server.listen(process.env.PORT || 3000, process.env.IP || '127.0.0.1')

async function receiveRequest(req, res) {
  res.statusCode = 200
  // confirm it came from the Dashboard server
  if (req.headers['x-dashboard-server'] === process.env.DASHBOARD_SERVER) {
    if (!req.headers['x-accountid']) {
      // guest accessing something
      const token = req.headers['x-dashboard-token']
      const expected = process.env.APPLICATION_SERVER_TOKEN
      req.dashboardServer = await bcrypt.compareSync(expected, token)
    } else {
      // user is signed in
      const token = req.headers['x-dashboard-token']
      const accountid = req.headers['x-accountid']
      const sessionid = req.headers['x-sessionid']
      const expected = `${process.env.APPLICATION_SERVER_TOKEN}/${accountid}/${sessionid}`
      req.dashboardServer = await bcrypt.compareSync(expected, token)
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
  const urlPath = req.url.split('?')[0]
  let filename
  switch (urlPath) {
    case '/':
      filename = 'index.html'
      res.setHeader('content-type', 'text/html')
      break
    case '/home':
      filename = 'home.html'
      res.setHeader('content-type', 'text/html')
      break
    case '/whois.js':
      filename = 'whois.js.js'
      res.setHeader('content-type', 'text/javascript')
      break
    case '/public/app.css':
      filename = urlPath
      res.setHeader('content-type', 'text/css')
      break
    case '/public/app.js':
      filename = urlPath
      res.setHeader('content-type', 'text/javascript')
      break
    default:
      console.log('bad2....', urlPath)
      res.statusCode = 404
      return res.end()
  }
  res.statusCode = 200
  const fileContents = fs.readFileSync(path.join(`${__dirname}/src/www`, filename))
  return res.end(fileContents)
}