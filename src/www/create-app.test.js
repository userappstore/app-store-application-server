/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/create-app', () => {
  describe('CreateApp#BEFORE', () => {
    it('should bind projects', async () => {
      const user = await TestHelper.createUser()
      const project1 = await TestHelper.createProject(user, { projectid: 'project-1' })
      await TestHelper.wait()
      const project2 = await TestHelper.createProject(user, { projectid: 'project-2' })
      await TestHelper.wait()
      const project3 = await TestHelper.createProject(user, { projectid: 'project-3' })
      await TestHelper.wait()
      const req = TestHelper.createRequest('/create-app', 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}&all=true`]: [{
          id: 'stripe_1', object: 'account', created: 1, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true
        }]
      }
      await req.route.api.before(req)
      assert.strictEqual(req.data.projects[0].projectid, project3.projectid)
      assert.strictEqual(req.data.projects[1].projectid, project2.projectid)
      assert.strictEqual(req.data.projects[2].projectid, project1.projectid)
    })

    it('should bind Stripe accounts with payouts enabled', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/create-app', 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}&all=true`]: [{
          id: 'stripe_4', object: 'account', created: 4, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true
        }, {
          id: 'stripe_3', object: 'account', created: 3, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true
        }, {
          id: 'stripe_2', object: 'account', created: 2, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: false
        }, {
          id: 'stripe_1', object: 'account', created: 1, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: false
        }]
      }
      await req.route.api.before(req)
      assert.strictEqual(req.data.accounts.length, 2)
      assert.strictEqual(req.data.accounts[0].id, 'stripe_4')
      assert.strictEqual(req.data.accounts[1].id, 'stripe_3')
    })
  })

  describe('CreateApp#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/create-app', 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}&all=true`]: [{
          id: 'stripe_4', object: 'account', created: 4, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true
        }]
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
        assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
      }
      return req.route.api.get(req, res)
    })
  })

  describe('CreateApp#POST', () => {
    it('should reject invalid appid', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.wait()
      const project = await TestHelper.createProject(user)
      const req = TestHelper.createRequest('/create-app', 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        appid: 'something invalid',
        projectid: project.projectid,
        name: 'The app name',
        stripeid: 'stripe_4',
        application_fee: '0.05'
      }
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_4`]: {
          id: 'stripe_4', object: 'account', created: 4, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true
        },
        [`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}&all=true`]: [{
          id: 'stripe_4', object: 'account', created: 4, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true
        }]
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const message = doc.getElementById('message-container').child[0]
        assert.strictEqual(message.attr.template, 'invalid-appid')
      }
      return req.route.api.post(req, res)
    })

    it('should reject duplicate appid', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', stripeid: 'stripe_1', application_fee: '0.05' })
      await TestHelper.wait()
      const project = await TestHelper.createProject(user)
      const req = TestHelper.createRequest('/create-app', 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        appid: app.appid,
        projectid: project.projectid,
        name: 'The app name',
        stripeid: 'stripe_4',
        application_fee: '0.05'
      }
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_4`]: {
          id: 'stripe_4', object: 'account', created: 4, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true
        },
        [`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}&all=true`]: [{
          id: 'stripe_4', object: 'account', created: 4, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true
        }]
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const message = doc.getElementById('message-container').child[0]
        assert.strictEqual(message.attr.template, 'duplicate-appid')
      }
      return req.route.api.post(req, res)
    })

    it('should reject missing Stripe account', async () => {
      const user = await TestHelper.createUser()
      const project = await TestHelper.createProject(user)
      const req = TestHelper.createRequest('/create-app', 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        projectid: project.projectid,
        name: 'The app name',
        application_fee: '0.05'
      }
      global.testResponse = {
        [`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}&all=true`]: []
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const message = doc.getElementById('message-container').child[0]
        assert.strictEqual(message.attr.template, 'invalid-stripeid')
      }
      return req.route.api.post(req, res)
    })

    it('should reject missing source', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/create-app', 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        name: 'The app name',
        stripeid: 'stripe_4',
        application_fee: '0.05'
      }
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_4`]: {
          id: 'stripe_4', object: 'account', created: 4, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true
        },
        [`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}&all=true`]: [{
          id: 'stripe_4', object: 'account', created: 4, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true
        }]
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const message = doc.getElementById('message-container').child[0]
        assert.strictEqual(message.attr.template, 'invalid-source')
      }
      return req.route.api.post(req, res)
    })

    it('should reject insecure URL', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/create-app', 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        url: 'http://something',
        name: 'The app name',
        stripeid: 'stripe_4',
        application_fee: '0.05'
      }
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_4`]: {
          id: 'stripe_4', object: 'account', created: 4, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true
        },
        [`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}&all=true`]: [{
          id: 'stripe_4', object: 'account', created: 4, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true
        }]
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const message = doc.getElementById('message-container').child[0]
        assert.strictEqual(message.attr.template, 'invalid-url')
      }
      return req.route.api.post(req, res)
    })

    it('should reject invalid project', async () => {
      const user = await TestHelper.createUser()
      const user2 = await TestHelper.createUser()
      await TestHelper.createProject(user2)
      const req = TestHelper.createRequest('/create-app', 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        projectid: user2.project.projectid,
        name: 'The app name',
        stripeid: 'stripe_4',
        application_fee: '0.05'
      }
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_4`]: {
          id: 'stripe_4', object: 'account', created: 4, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true
        },
        [`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}&all=true`]: [{
          id: 'stripe_4', object: 'account', created: 4, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true
        }]
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const message = doc.getElementById('message-container').child[0]
        assert.strictEqual(message.attr.template, 'invalid-projectid')
      }
      return req.route.api.post(req, res)
    })

    it('should generate appid if not provided', async () => {
      const user = await TestHelper.createUser()
      const project = await TestHelper.createProject(user)
      const req = TestHelper.createRequest('/create-app', 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        projectid: project.projectid,
        name: 'The app name',
        stripeid: 'stripe_4',
        application_fee: '0.05'
      }
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_4`]: {
          id: 'stripe_4', object: 'account', created: 4, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true
        },
        [`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}&all=true`]: [{
          id: 'stripe_4', object: 'account', created: 4, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true
        }]
      }
      const res = TestHelper.createResponse()
      res.end = async () => {
        assert.equal(req.success, true)
      }
      return req.route.api.post(req, res)
    })

    it('should create from project after authorization', async () => {
      const user = await TestHelper.createUser()
      const project = await TestHelper.createProject(user)
      const req = TestHelper.createRequest('/create-app', 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        appid: 'from-project',
        projectid: project.projectid,
        name: 'The app name',
        stripeid: 'stripe_4',
        application_fee: '0.05'
      }
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_4`]: {
          id: 'stripe_4', object: 'account', created: 4, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true
        },
        [`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}&all=true`]: [{
          id: 'stripe_4', object: 'account', created: 4, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true
        }]
      }
      const res = TestHelper.createResponse()
      res.end = async () => {
        assert.equal(req.success, true)
      }
      return req.route.api.post(req, res)
    })

    it('should create from URL after authorization', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/create-app', 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        url: 'https://something',
        name: 'The app name',
        stripeid: 'stripe_4',
        application_fee: '0.05'
      }
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_4`]: {
          id: 'stripe_4', object: 'account', created: 4, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true
        },
        [`/api/user/connect/stripe-accounts?accountid=${user.account.accountid}&all=true`]: [{
          id: 'stripe_4', object: 'account', created: 4, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true
        }]
      }
      const res = TestHelper.createResponse()
      res.end = async () => {
        assert.equal(req.success, true)
      }
      return req.route.api.post(req, res)
    })
  })
})
