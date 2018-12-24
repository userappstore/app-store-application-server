/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/position-items', () => {
  describe('PositionItems#BEFORE', () => {
    it('should require collectionid', async () => {
      const req = TestHelper.createRequest('/position-items?collectionid=', 'GET')
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
      const req = TestHelper.createRequest(`/position-items?collectionid=${collection1.collectionid}`, 'GET')
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
      const req = TestHelper.createRequest(`/position-items?collectionid=${collection.collectionid}`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.collection.collectionid, collection.collectionid)
    })
  })

  describe('PositionItems#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      const collection = await TestHelper.createCollection(user)
      const req = TestHelper.createRequest(`/position-items?collectionid=${collection.collectionid}`, 'GET')
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

  describe('PositionItems#POST', () => {
    it('should reject invalid installid', async () => {
      const user = await TestHelper.createUser()
      const collection = await TestHelper.createCollection(user)
      const req = TestHelper.createRequest(`/position-items?collectionid=${collection.collectionid}`, 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        installid: 'invalid'
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'invalid-installid')
      }
      return req.route.api.post(req, res)
    })

    it('should position items after authorization', async () => {
      const user = await TestHelper.createUser()
      const collection = await TestHelper.createCollection(user)
      const install1 = await TestHelper.createInstall(user)
      await TestHelper.addCollectionItem(user, collection, install1)
      await TestHelper.wait()
      const install2 = await TestHelper.createInstall(user)
      await TestHelper.addCollectionItem(user, collection, install2)
      await TestHelper.wait()
      const install3 = await TestHelper.createInstall(user)
      await TestHelper.addCollectionItem(user, collection, install3)
      await TestHelper.wait()
      const req = TestHelper.createRequest(`/position-items?collectionid=${collection.collectionid}`, 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        [`position-${install1.installid}`]: '3',
        [`position-${install2.installid}`]: '1',
        [`position-${install3.installid}`]: '2'
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'success')
        assert.strictEqual(install1.installid, req.data.collectionInstalls[2].installid)
        assert.strictEqual(install2.installid, req.data.collectionInstalls[0].installid)
        assert.strictEqual(install3.installid, req.data.collectionInstalls[1].installid)
      }
      return req.route.api.post(req, res)
    })
  })
})
