/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/install-app', () => {
  describe('InstallApp#BEFORE', () => {
    it('should require appid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/install-app?appid=', 'GET')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-appid')
    })

    it('should require published appid', async () => {
      const user1 = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user1.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user1, { url: 'https://something', published: true, unpublished: true, stripeid: 'stripe_1', application_fee: '0.05' })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/install-app?appid=${app.appid}`, 'GET')
      req.account = user2.account
      req.session = user2.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-app')
    })

    it('should bind app to req', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/organizations/organizations?accountid=${user.account.accountid}`]: []
      }
      const req = TestHelper.createRequest(`/install-app?appid=${app.appid}`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.app.appid, app.appid)
    })

    it('should bind organizations to req', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      const req = TestHelper.createRequest(`/install-app?appid=${app.appid}`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/organizations/organizations?accountid=${user.account.accountid}`]: [{ organizationid: 'organization_1', object: 'organization', owner: user.account.accountid }]
      }
      await req.route.api.before(req)
      assert.strictEqual(req.data.app.appid, app.appid)
    })
  })

  describe('InstallApp#GET', () => {
    it('should present the plans list', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      const req = TestHelper.createRequest(`/install-app?appid=${app.appid}`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/organizations/organizations?accountid=${user.account.accountid}`]: [{ organizationid: 'organization_1', object: 'organization', owner: user.account.accountid }]
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        assert.strictEqual(doc.getElementById('plans-list').tag, 'select')
      }
      return req.route.api.get(req, res)
    })

    it('should present the organizations list', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      const req = TestHelper.createRequest(`/install-app?appid=${app.appid}`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/organizations/organizations?accountid=${user.account.accountid}`]: [{ organizationid: 'organization_1', object: 'organization', owner: user.account.accountid }]
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        assert.strictEqual(doc.getElementById('organizations-list').tag, 'select')
      }
      return req.route.api.get(req, res)
    })
  })

  describe('InstallApp#POST', () => {
    it('should require text', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      const req = TestHelper.createRequest(`/install-app?appid=${app.appid}`, 'GET')
      req.account = user.account
      req.session = user.session
      req.body = {
        text: null,
        planid: 'plan_1'
      }
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/organizations/organizations?accountid=${user.account.accountid}`]: [{ organizationid: 'organization_1', object: 'organization', owner: user.account.accountid }]
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

    it('should reject invalid organizationid', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      const req = TestHelper.createRequest(`/install-app?appid=${app.appid}`, 'GET')
      req.account = user.account
      req.session = user.session
      req.body = {
        text: 'text',
        organizationid: 'invalid',
        planid: 'plan_1'
      }
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/organizations/organizations?accountid=${user.account.accountid}`]: [{ organizationid: 'organization_1', object: 'organization', owner: user.account.accountid }]
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'invalid-organizationid')
      }
      return req.route.api.post(req, res)
    })

    it('should reject invalid plan', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      const req = TestHelper.createRequest(`/install-app?appid=${app.appid}`, 'GET')
      req.account = user.account
      req.session = user.session
      req.body = {
        text: 'text',
        organizationid: 'organization_1',
        planid: 'invalid'
      }
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/organizations/organizations?accountid=${user.account.accountid}`]: [{ organizationid: 'organization_1', object: 'organization', owner: user.account.accountid }]
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'invalid-planid')
      }
      return req.route.api.post(req, res)
    })

    it('should create organization install and redirect to setup page', async () => {
      const user = await TestHelper.createUser()
      const user2 = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      const req = TestHelper.createRequest(`/install-app?appid=${app.appid}`, 'GET')
      req.account = user.account
      req.session = user.session
      req.body = {
        text: 'text',
        organizationid: 'organization_1',
        planid: 'plan_1'
      }
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } },
        [`/api/user/organizations/organizations?accountid=${user.account.accountid}`]: [{ organizationid: 'organization_1', object: 'organization', owner: user.account.accountid }],
        [`/api/user/organizations/organization?organizationid=organization_1`]: { organizationid: 'organization_1', object: 'organization', owner: user.account.accountid },
        [`/api/user/organizations/organization-memberships?organizationid=organization_1`]: [{
          membershipid: 'membership_1',
          accountid: user.account.accountid
        }, {
          membershipid: 'membership_2',
          accountid: user2.account.accountid
        }]
      }
      const res = TestHelper.createResponse()
      res.end = async () => {
        assert.strictEqual(res.statusCode, 302)
        assert.notStrictEqual(res.headers['location'], null)
        assert.notStrictEqual(res.headers['location'], undefined)
      }
      return req.route.api.post(req, res)
    })

    it('should create personal install and redirect to setup page', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      const req = TestHelper.createRequest(`/install-app?appid=${app.appid}`, 'GET')
      req.account = user.account
      req.session = user.session
      req.body = {
        text: 'text',
        organizationid: 'personal',
        planid: 'plan_1'
      }
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } },
        [`/api/user/organizations/organizations?accountid=${user.account.accountid}`]: []
      }
      const res = TestHelper.createResponse()
      res.end = async () => {
        assert.strictEqual(res.statusCode, 302)
        assert.notStrictEqual(res.headers['location'], null)
        assert.notStrictEqual(res.headers['location'], undefined)
      }
      return req.route.api.post(req, res)
    })
  })
})
