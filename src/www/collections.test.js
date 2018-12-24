/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/collections', () => {
  describe('Collections#BEFORE', () => {
    it('should bind collections to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createCollection(user)
      await TestHelper.wait()
      const req = TestHelper.createRequest(`/collections`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.collections[0].collectionid, user.collection.collectionid)
    })
  })

  describe('Collections#GET', () => {
    it('should limit collections to one page', async () => {
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createCollection(user)
        await TestHelper.wait()
      }
      const req = TestHelper.createRequest('/collections', 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('collections-table')
        const rows = table.getElementsByTagName('tr')
        assert.strictEqual(rows.length, global.pageSize + 1)
      }
      return req.route.api.get(req, res)
    })

    it('should enforce page size', async () => {
      global.pageSize = 3
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createCollection(user)
        await TestHelper.wait()
      }
      const req = TestHelper.createRequest('/collections', 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('collections-table')
        const rows = table.getElementsByTagName('tr')
        assert.strictEqual(rows.length, global.pageSize + 1)
      }
      return req.route.api.get(req, res)
    })

    it('should enforce specified offset', async () => {
      const offset = 1
      const user = await TestHelper.createUser()
      const collections = [user.collection]
      for (let i = 0, len = offset + global.pageSize + 1; i < len; i++) {
        const collection = await TestHelper.createCollection(user)
        await TestHelper.wait()
        collections.unshift(collection)
      }
      const req = TestHelper.createRequest(`/collections?offset=${offset}`, 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        for (let i = 0, len = global.pageSize; i < len; i++) {
          assert.strictEqual(doc.getElementById(collections[offset + i].collectionid).tag, 'tr')
        }
      }
      return req.route.api.get(req, res)
    })
  })
})
