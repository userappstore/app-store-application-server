const API = require('./src/api.js')
const path = require('path')
const Server = require('./src/server.js')
const Sitemap = require('./src/sitemap.js')
const Timestamp = require('./src/timestamp.js')

global.storagePath = process.env.STORAGE_PATH || path.join(__dirname, 'data')
global.applicationPath = __dirname
global.pageSize = 100
global.minimumProfileFirstNameLength = parseInt(process.env.MINIMUM_PROFILE_FIRST_NAME_LENGTH || '1', 10)
global.maximumProfileFirstNameLength = parseInt(process.env.MAXIMUM_PROFILE_FIRST_NAME_LENGTH || '50', 10)
global.minimumProfileLastNameLength = parseInt(process.env.MINIMUM_PROFILE_LAST_NAME_LENGTH || '1', 10)
global.maximumProfileLastNameLength = parseInt(process.env.MAXIMUM_PROFILE_LAST_NAME_LENGTH || '50', 10)
global.sampleProjectOrganization = process.env.SAMPLE_PROJECT_ORGANIZATION || ''


module.exports = {
  HTML: require('./src/html.js'),
  Storage: require('./src/storage.js'),
  StorageList: require('./src/storage-list.js'),
  StorageObject: require('./src/storage-object.js'),
  Timestamp: require('./src/timestamp.js'),
  UUID: require('./src/uuid.js'),
  start: async (rootPath) => {
    global.rootPath = rootPath || global.rootPath
    global.sitemap = Sitemap.generate()
    global.api = API.generate()
    await Server.start()
  },
  stop: async () => {
    await Server.stop()
    clearInterval(Timestamp.interval)
    Timestamp.interval = null
  }
}
