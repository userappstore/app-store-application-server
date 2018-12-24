const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    const offset = req.query && req.query.offset ? parseInt(req.query.offset, 10) : 0
    const published = await userAppStore.AppStore.listPublished(offset)
    if (!published || !published.length) {
      return null
    }
    return published
  }
}
