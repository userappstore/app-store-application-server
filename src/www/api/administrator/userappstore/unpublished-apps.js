const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    const offset = req.query && req.query.offset ? parseInt(req.query.offset, 10) : 0
    const unpublished = await userAppStore.AppStore.listUnpublished(offset)
    if (!unpublished || !unpublished.length) {
      return null
    }
    return unpublished
  }
}
