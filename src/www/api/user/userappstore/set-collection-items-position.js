module.exports = {
 patch: async (req) => {
    if (!req.query || !req.query.collectionid) {
      throw new Error('invalid-collectionid')
    }
    const collection = await global.api.user.userappstore.Collection.get(req)
    if (!collection.items || !collection.items.length) {
      throw new Error('invalid-installid')
    }
    for (const installid of collection.items) {
      let positionStr = req.body[`position-${installid}`]
      if (!positionStr || !positionStr.length) {
        continue
      }
      let position
      try {
        position = parseInt(positionStr, 10)
      } catch (error) {
        throw new Error('invalid-position')
      }
      req.body.position = position
      req.body.installid = installid
      await global.api.user.userappstore.SetCollectionItemPosition.patch(req)
    }
  }
}
