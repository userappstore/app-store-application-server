/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe(`/edit-collection`, () => {
  describe('EditCollection#BEFORE', () => {
    it('should reject invalid collectionid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/edit-collection?collectionid=invalid`, 'GET')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-collectionid')
    })

    it('should bind collection to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createCollection(user)
      const req = TestHelper.createRequest(`/edit-collection?collectionid=${user.collection.collectionid}`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.collection.collectionid, user.collection.collectionid)
    })
  })

  describe('EditCollection#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createCollection(user)
      const req = TestHelper.createRequest(`/edit-collection?collectionid=${user.collection.collectionid}`, 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
        assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
      }
      return req.route.api.get(req, res)
    })
  })

  describe('EditCollection#POST', () => {
    it('should reject invalid name', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createCollection(user)
      const req = TestHelper.createRequest(`/edit-collection?collectionid=${user.collection.collectionid}`, 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        name: null,
        text: '#FFF',
        background: '#000'
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'invalid-name')
      }
      return req.route.api.post(req, res)
    })

    it('should reject invalid text color', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createCollection(user)
      const req = TestHelper.createRequest(`/edit-collection?collectionid=${user.collection.collectionid}`, 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        name: 'the text',
        text: null,
        background: '#000'
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'invalid-text')
      }
      return req.route.api.post(req, res)
    })

    it('should reject invalid background color', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createCollection(user)
      const req = TestHelper.createRequest(`/edit-collection?collectionid=${user.collection.collectionid}`, 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        name: 'the text',
        text: '#FFF',
        background: null
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'invalid-background')
      }
      return req.route.api.post(req, res)
    })

    it('should update after authorization', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createCollection(user)
      const req = TestHelper.createRequest(`/edit-collection?collectionid=${user.collection.collectionid}`, 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        name: 'the text',
        text: '#FFF',
        background: '#000'
      }
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
