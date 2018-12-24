/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/about', () => {
  describe('About#BEFORE', () => {
    it('should require appid', async () => {
      const req = TestHelper.createRequest('/about?appid=', 'GET')
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-appid')
    })

    it('should require published app', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', stripeid: 'stripe_1', application_fee: '0.05' })
      const req = TestHelper.createRequest(`/about?appid=${app.appid}`, 'GET')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-app')
    })

    it('should allow other user access', async () => {
      const user1 = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user1.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user1, { url: 'https://something', stripeid: 'stripe_1', published: true, application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/userappstore/publisher?stripeid=${app.stripeid}`]: {
          id: 'stripe_1', object: 'account', created: 2, legal_entity: { type: 'individual' }
        },
        [`/api/user/${app.appid}/subscriptions/published-plans?stripeid=${app.stripeid}`]: [
          { id: 'plan_1', object: 'plan' }
        ]
      }
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/about?appid=${app.appid}`, 'GET')
      req.account = user2.account
      req.session = user2.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, undefined)
    })

    it('should bind app, plans and publisher to req', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', stripeid: 'stripe_1', published: true, application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/userappstore/publisher?stripeid=${app.stripeid}`]: {
          id: 'stripe_1', object: 'account', created: 2, legal_entity: { type: 'individual' }
        },
        [`/api/user/${app.appid}/subscriptions/published-plans?stripeid=${app.stripeid}`]: [
          { id: 'plan_1', object: 'plan', metadata: { appid: app.appid } }
        ]
      }
      const req = TestHelper.createRequest(`/about?appid=${app.appid}`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.stripeAccount.id, 'stripe_1')
      assert.strictEqual(req.data.plans.length, 1)
      assert.strictEqual(req.data.app.appid, user.app.appid)
    })
  })

  describe('About#GET', () => {
    it('should present the publisher table', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', stripeid: 'stripe_1', published: true, application_fee: '0.05' })
      const req = TestHelper.createRequest(`/about?appid=${user.app.appid}`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/userappstore/publisher?stripeid=${app.stripeid}`]: {
          id: "stripe_1", object: 'account', created: 2, legal_entity: { type: 'individual' }
        },
        [`/api/user/${app.appid}/subscriptions/published-plans?stripeid=${app.stripeid}`]: [
          { id: "plan_1", object: 'plan', metadata: { appid: app.appid } }
        ]
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById(app.stripeid)
        assert.strictEqual(table.tag, 'table')
      }
      return req.route.api.get(req, res)
    })
  })
})
