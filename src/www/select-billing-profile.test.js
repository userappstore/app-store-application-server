/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/select-billing-profile', () => {
  describe('SelectBillingProfile#BEFORE', () => {
    it('should require installid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/select-billing-profile?installid=', 'GET')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-installid')
    })

    it('should require own installid', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } },
        [`/api/user/subscriptions/customers?accountid=${user.account.accountid}`]: [{ id: 'customer_1', object: 'customer', metadata: { accountid: user.account.accountid } }],
      }
      const install = await TestHelper.createInstall(user, { appid: app.appid, planid: 'plan_1' })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/select-billing-profile?installid=${install.installid}`, 'GET')
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


    it('should reject non-app install', async () => {
      const user = await TestHelper.createUser()
      const install = await TestHelper.createInstall(user, { url: 'https://something' })
      const req = TestHelper.createRequest(`/select-billing-profile?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      req.body = {
        customerid: 'customer_1'
      }
      let errorMessage
      try {
        await req.route.api.post(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-install')
    })

    it('should bind install to req', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } },
        [`/api/user/subscriptions/customers?accountid=${user.account.accountid}`]: [{ id: 'customer_1', object: 'customer', metadata: { accountid: user.account.accountid } }],
      }
      const install = await TestHelper.createInstall(user, { appid: app.appid, planid: 'plan_1' })
      const req = TestHelper.createRequest(`/select-billing-profile?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.install.installid, install.installid)
    })

    it('should bind customer objects to req', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } },
        [`/api/user/subscriptions/customers?accountid=${user.account.accountid}`]: [{ id: 'customer_1', object: 'customer', metadata: { accountid: user.account.accountid } }],
      }
      const install = await TestHelper.createInstall(user, { appid: app.appid, planid: 'plan_1' })
      const req = TestHelper.createRequest(`/select-billing-profile?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.install.installid, install.installid)
    })
  })

  describe('SelectBillingProfile#GET', () => {
    it('should present the customers list', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } },
        [`/api/user/subscriptions/customers?accountid=${user.account.accountid}`]: [{ id: 'customer_1', object: 'customer', metadata: { accountid: user.account.accountid } }],
      }
      const install = await TestHelper.createInstall(user, { appid: app.appid, planid: 'plan_1' })
      const req = TestHelper.createRequest(`/select-billing-profile?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        assert.strictEqual(doc.getElementById('customerid').tag, 'select')
      }
      return req.route.api.get(req, res)
    })
  })

  describe('SelectBillingProfile#POST', () => {
    it('should reject invalid customerid', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } },
        [`/api/user/subscriptions/customers?accountid=${user.account.accountid}`]: [{ id: 'customer_1', object: 'customer', metadata: { accountid: user.account.accountid } }],
      }
      const install = await TestHelper.createInstall(user, { appid: app.appid, planid: 'plan_1' })
      const req = TestHelper.createRequest(`/select-billing-profile?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      req.body = {
        customerid: 'invalid'
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'invalid-customerid')

      }
      return req.route.api.post(req, res)
    })

    it('should require customer have a card for paid plans', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid }, amount: 1000 }],
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } },
        [`/api/user/subscriptions/customers?accountid=${user.account.accountid}`]: [{ id: 'customer_1', object: 'customer', metadata: { accountid: user.account.accountid } }],
      }
      const install = await TestHelper.createInstall(user, { appid: app.appid, planid: 'plan_1' })
      const req = TestHelper.createRequest(`/select-billing-profile?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      req.body = {
        customerid: 'invalid'
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'invalid-customerid')
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
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid }, amount: 1000 }],
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } },
        [`/api/user/subscriptions/customers?accountid=${user.account.accountid}`]: [{ id: 'customer_1', object: 'customer', metadata: { accountid: user.account.accountid }, default_source: 'card_1' }],
        [`/api/user/subscriptions/customer?customerid=customer_1`]: { id: 'customer_1', object: 'customer', metadata: { accountid: user.account.accountid }, default_source: 'card_1' },
        [`/api/user/${app.appid}/subscriptions/create-subscription?planid=plan_1`]: { id: 'subscription_1' }
      }
      const install = await TestHelper.createInstall(user, { appid: app.appid, planid: 'plan_1' })
      const req = TestHelper.createRequest(`/select-billing-profile?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      req.body = {
        customerid: 'customer_1'
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
