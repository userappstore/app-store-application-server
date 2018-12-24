/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/billing-profiles', () => {
  describe('BillingProfiles#BEFORE', () => {
    it('should bind customers to req', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/billing-profiles`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/subscriptions/customers-count?accountid=${user.account.accountid}`]: 1,
        [`/api/user/subscriptions/customers?accountid=${user.account.accountid}&offset=0`]: [{
          id: 'cus_1',
          object: 'customer',
          sources: {
            data: [{ id: 'card', brand: 'visa', last4: 1234, exp_month: 1, exp_year: 50 }]
          }
        }]
      }
      await req.route.api.before(req)
      assert.strictEqual(req.data.customers[0].id, 'cus_1')
    })
  })

  describe('BillingProfiles#GET', () => {
    it('should limit billing profiles to one page', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/billing-profiles', 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/subscriptions/customers-count?accountid=${user.account.accountid}`]: 3,
        [`/api/user/subscriptions/customers?accountid=${user.account.accountid}&offset=0`]: [{
          id: 'cus_3',
          object: 'customer',
          sources: {
            data: [{ id: 'card', brand: 'visa', last4: 1234, exp_month: 1, exp_year: 50 }]
          }
        }, {
          id: 'cus_2',
          object: 'customer',
          sources: {
            data: [{ id: 'card', brand: 'visa', last4: 1234, exp_month: 1, exp_year: 50 }]
          }
        }]
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('customers-table')
        const rows = table.getElementsByTagName('tr')
        assert.strictEqual(rows.length, global.pageSize + 1)
      }
      return req.route.api.get(req, res)
    })

    it('should enforce page size', async () => {
      global.pageSize = 3
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/billing-profiles', 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/subscriptions/customers-count?accountid=${user.account.accountid}`]: 4,
        [`/api/user/subscriptions/customers?accountid=${user.account.accountid}&offset=0`]: [{
          id: 'cus_4',
          object: 'customer',
          sources: {
            data: [{ id: 'card', brand: 'visa', last4: 1234, exp_month: 1, exp_year: 50 }]
          }
        }, {
          id: 'cus_3',
          object: 'customer',
          sources: {
            data: [{ id: 'card', brand: 'visa', last4: 1234, exp_month: 1, exp_year: 50 }]
          }
        }, {
          id: 'cus_2',
          object: 'customer',
          sources: {
            data: [{ id: 'card', brand: 'visa', last4: 1234, exp_month: 1, exp_year: 50 }]
          }
        }]
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('customers-table')
        const rows = table.getElementsByTagName('tr')
        assert.strictEqual(rows.length, global.pageSize + 1)
      }
      return req.route.api.get(req, res)
    })

    it('should enforce specified offset', async () => {
      const offset = 1
      const user = await TestHelper.createUser()
      const customers = [{
        id: 'cus_3',
        object: 'customer',
        sources: {
          data: [{ id: 'card', brand: 'visa', last4: 1234, exp_month: 1, exp_year: 50 }]
        }
      }, {
        id: 'cus_2',
        object: 'customer',
        sources: {
          data: [{ id: 'card', brand: 'visa', last4: 1234, exp_month: 1, exp_year: 50 }]
        }
      }, {
        id: '1',
        object: 'customer',
        sources: {
          data: [{ id: 'card', brand: 'visa', last4: 1234, exp_month: 1, exp_year: 50 }]
        }
      }]
      const req = TestHelper.createRequest(`/billing-profiles?offset=${offset}`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/subscriptions/customers-count?accountid=${user.account.accountid}`]: 3,
        [`/api/user/subscriptions/customers?accountid=${user.account.accountid}&offset=${offset}`]: customers
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        for (let i = 0, len = global.pageSize; i < len; i++) {
          assert.strictEqual(doc.getElementById(customers[offset + i].id).tag, 'tr')
        }
      }
      return req.route.api.get(req, res)
    })
  })
})
