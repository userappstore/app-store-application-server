/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/delete-collection', () => {
  describe('DeleteCollection#BEFORE', () => {
    it('should require collectionid', async () => {
      const req = TestHelper.createRequest('/delete-collection?collectionid=', 'GET')
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-collectionid')
    })

    it('should require own collectionid', async () => {
      const user1 = await TestHelper.createUser()
      const collection1 = await TestHelper.createCollection(user1)
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/delete-collection?collectionid=${collection1.collectionid}`, 'GET')
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
      const req = TestHelper.createRequest(`/delete-collection?collectionid=${collection.collectionid}`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.collection.collectionid, collection.collectionid)
    })
  })

  describe('DeleteCollection#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      const collection = await TestHelper.createCollection(user)
      const req = TestHelper.createRequest(`/delete-collection?collectionid=${collection.collectionid}`, 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
        assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
      }
      await req.route.api.before(req)
      return req.route.api.get(req, res)
    })
  })

  describe('DeleteCollection#POST', () => {
    it('should collectionly after authorization', async () => {
      const user = await TestHelper.createUser()
      const collection = await TestHelper.createCollection(user)
      const req = TestHelper.createRequest(`/delete-collection?collectionid=${collection.collectionid}`, 'POST')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'success')
      }
      return req.route.api.post(req, res)
    })
  })
})
