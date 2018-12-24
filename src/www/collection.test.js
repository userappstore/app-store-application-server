/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/collection', () => {
  describe('Collection#BEFORE', () => {
    it('should require collectionid', async () => {
      const req = TestHelper.createRequest('/collection?collectionid=', 'GET')
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-collectionid')
    })

    it('should reject other account\'s collection', async () => {
      const user1 = await TestHelper.createUser()
      const collection = await TestHelper.createCollection(user1)
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/collection?collectionid=${collection.collectionid}`, 'GET')
      req.account = user2.account
      req.session = user2.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it('should bind collection to req', async () => {
      const user = await TestHelper.createUser()
      const collection = await TestHelper.createCollection(user)
      const req = TestHelper.createRequest(`/collection?collectionid=${collection.collectionid}`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.collection.collectionid, user.collection.collectionid)
    })
  })

  describe('Collection#GET', () => {
    it('should present the collection table', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createCollection(user)
      const req = TestHelper.createRequest(`/collection?collectionid=${user.collection.collectionid}`, 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('collections-table')
        const tbody = table.getElementById(user.collection.collectionid)
        assert.strictEqual(tbody.tag, 'tbody')
      }
      return req.route.api.get(req, res)
    })
  })
})
