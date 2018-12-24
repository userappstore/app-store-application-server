/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/publisher', () => {
  describe('Publisher#BEFORE', () => {
    it('should require stripeid', async () => {
      const req = TestHelper.createRequest('/publisher?stripeid=', 'GET')
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripeid')
    })

    it('should require active Stripe account', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/publisher?stripeid=${user.stripeid}`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/userappstore/publisher?stripeid=${user.stripeid}`]: {
          id: 'stripe_1',
          object: 'account',
          payouts_enabled: false,
          legal_entity: {
            type: 'individual'
          }
        }
      }
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripe-account')
    })

    it('should allow other user access', async () => {
      const user1 = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user1.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const stripe = await TestHelper.createApp(user1, { url: 'https://something', stripeid: 'stripe_1', published: true, application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/userappstore/publisher?stripeid=${user1.stripeid}`]: {
          id: 'stripe_1',
          object: 'account',
          payouts_enabled: true,
          legal_entity: {
            type: 'individual'
          }
        }
      }
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/publisher?stripeid=${user1.stripeid}`, 'GET')
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

    it('should bind stripe account to req', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/userappstore/publisher?stripeid=${user.stripeid}`]: {
          id: 'stripe_1',
          object: 'account',
          payouts_enabled: true,
          legal_entity: {
            type: 'individual'
          }
        }
      }
      const req = TestHelper.createRequest(`/publisher?stripeid=${user.stripeid}`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.stripeAccount.id, 'stripe_1')
    })
  })

  describe('Publisher#GET', () => {
    it('should present the stripe table', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/userappstore/publisher?stripeid=${user.stripeid}`]: {
          id: 'stripe_1',
          object: 'account',
          payouts_enabled: true,
          legal_entity: {
            type: 'individual'
          }
        }
      }
      const req = TestHelper.createRequest(`/publisher?stripeid=${user.stripeid}`, 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('stripe-accounts-table')
        const individual = table.getElementById('individual')
        const company = table.getElementById('company')
        assert.strictEqual(company, undefined)
        assert.strictEqual(individual.tag, 'tbody')
      }
      return req.route.api.get(req, res)
    })
  })
})
