/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/invoices', () => {
  describe('Invoices#BEFORE', () => {
    it('should bind invoices to req', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/invoices`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/subscriptions/invoices-count?accountid=${user.account.accountid}`]: 1,
        [`/api/user/subscriptions/invoices?accountid=${user.account.accountid}&offset=0`]: [{
          id: 'inv_1',
          object: 'invoice'
        }]
      }
      await req.route.api.before(req)
      assert.strictEqual(req.data.invoices[0].id, 'inv_1')
    })
  })

  describe('Invoices#GET', () => {
    it('should limit subscriptions to one page', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/invoices', 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/subscriptions/invoices-count?accountid=${user.account.accountid}`]: 3,
        [`/api/user/subscriptions/invoices?accountid=${user.account.accountid}&offset=0`]: [{
          id: 'inv_3',
          object: 'invoice'
        }, {
          id: 'inv_2',
          object: 'invoice'
        }]
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('invoices-table')
        const rows = table.getElementsByTagName('tr')
        assert.strictEqual(rows.length, global.pageSize + 1)
      }
      return req.route.api.get(req, res)
    })

    it('should enforce page size', async () => {
      global.pageSize = 3
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/invoices', 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/subscriptions/invoices-count?accountid=${user.account.accountid}`]: 4,
        [`/api/user/subscriptions/invoices?accountid=${user.account.accountid}&offset=0`]: [{
          id: 'inv_4',
          object: 'invoice'
        }, {
          id: 'inv_3',
          object: 'invoice'
        }, {
          id: 'inv_2',
          object: 'invoice'
        }]
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('invoices-table')
        const rows = table.getElementsByTagName('tr')
        assert.strictEqual(rows.length, global.pageSize + 1)
      }
      return req.route.api.get(req, res)
    })

    it('should enforce specified offset', async () => {
      const offset = 1
      const user = await TestHelper.createUser()
      const subscriptions = [{
        id: 'inv_3',
        object: 'invoice'
      }, {
        id: 'inv_2',
        object: 'invoice'
      }, {
        id: 'inv_1',
        object: 'invoice'
      }]
      const req = TestHelper.createRequest(`/invoices?offset=${offset}`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/subscriptions/invoices-count?accountid=${user.account.accountid}`]: 3,
        [`/api/user/subscriptions/invoices?accountid=${user.account.accountid}&offset=${offset}`]: subscriptions
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        for (let i = 0, len = global.pageSize; i < len; i++) {
          assert.strictEqual(doc.getElementById(subscriptions[offset + i].id).tag, 'tr')
        }
      }
      return req.route.api.get(req, res)
    })
  })
})
