// const Account = require('./account.js')
const fs = require('fs')
const HTML = require('./html.js')

module.exports = {
  generate
}

function generate() {
  let routes = {}
  // Dashboard defaults, if the server is a module then these are
  // files located within node_modules otherwise they are the root app
  attachRoutes(routes, `${__dirname}/www`)
  return routes
}

function attachRoutes(routes, folderPath) {
  if (!fs.existsSync(folderPath)) {
    return routes
  }
  if (folderPath.endsWith('/src/www/public')) {
    return routes
  }
  const apiOnly = folderPath.indexOf('/api/') > -1
  const folderContents = fs.readdirSync(folderPath)
  for (const file of folderContents) {
    const filePath = `${folderPath}/${file}`
    if (filePath.indexOf('navbar') !== -1 || filePath.endsWith('.test.js')) {
      continue
    }
    if (!filePath.endsWith('.html') && !filePath.endsWith('.js')) {
      const stat = fs.statSync(filePath)
      if (stat.isDirectory()) {
        attachRoutes(routes, filePath)
        continue
      }
      continue
    }
    const htmlFilePath = filePath.substring(0, filePath.lastIndexOf('.')) + '.html'
    const htmlFileExists = fs.existsSync(htmlFilePath)
    const jsFilePath = filePath.substring(0, filePath.lastIndexOf('.')) + '.js'
    const jsFileExists = fs.existsSync(jsFilePath)
    if (filePath.endsWith('.js') && htmlFileExists) {
      continue
    }
    const api = jsFileExists ? require(jsFilePath) : 'static-page'
    if (api !== 'static-page' && !api.get && !api.post && !api.patch && !api.delete && !api.put) {
      continue
    }
    if (api.before && !apiOnly) {
      wrapBeforeFunction(api)
    }
    const html = htmlFileExists ? fs.readFileSync(htmlFilePath).toString('utf-8') : null
    const extension = apiOnly ? '.js' : '.html'
    const index = `index${extension}`
    let folderStem = folderPath.substring(global.rootPath.length)
    if (folderStem.indexOf('src/www') > -1) {
      folderStem = folderStem.substring(folderStem.indexOf('src/www') + 'src/www'.length)
    }
    let urlKey = folderStem + (file === index ? '' : '/' + file.substring(0, file.lastIndexOf('.')))
    if (urlKey === '') {
      urlKey = '/'
    }
    let template = true
    let auth = api && api.auth === false ? api.auth : true
    let navbar = ''
    if (!apiOnly && html) {
      const settings = readHTMLAttributes(html)
      template = settings.template
      if (settings.auth !== false) {
        auth = true
      } else {
        auth = false
      }
      navbar = settings.navbar
    }
    routes[urlKey] = {
      htmlFilePath: htmlFileExists ? htmlFilePath.substring(global.applicationPath.length) : null,
      html,
      jsFilePath: jsFileExists ? jsFilePath.substring(global.applicationPath.length) : 'static-page',
      template,
      auth,
      navbar,
      api
    }
  }
  return routes
}

function readHTMLAttributes(html) {
  const doc = HTML.parse(html)
  const htmlTag = doc.getElementsByTagName('html')[0]
  let template = true
  let auth = true
  let navbar = ''
  if (htmlTag && htmlTag.attr) {
    template = htmlTag.attr.template !== 'false' && htmlTag.attr.template !== false
    auth = htmlTag.attr.auth !== 'false' && htmlTag.attr.auth !== false
    navbar = htmlTag.attr.navbar || ''
  }
  return { template, auth, navbar }
}

/**
 * wrapBeforeFunction takes an API route with a 'before' handler and
 * executes it before any GET, POST etc method
 * @param {*} nodejsHandler a web or API endpoint
 */
async function wrapBeforeFunction(nodejsHandler) {
  for (const verb of ['get', 'post', 'patch', 'delete', 'put']) {
    const originalFunction = nodejsHandler[verb]
    if (!originalFunction) {
      continue
    }
    nodejsHandler[verb] = async (req, res) => {
      await nodejsHandler.before(req)
      return originalFunction(req, res)
    }
  }
}
