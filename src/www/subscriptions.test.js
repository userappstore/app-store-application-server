/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/subscriptions', () => {
  describe('Subscriptions#BEFORE', () => {
    it('should bind subscriptions to req', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/subscriptions`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/subscriptions/subscriptions-count?accountid=${user.account.accountid}`]: 1,
        [`/api/user/subscriptions/subscriptions?accountid=${user.account.accountid}&offset=0`]: [{
          id: 'sub_1',
          object: 'subscription',
          name: 'subscription'
        }]
      }
      await req.route.api.before(req)
      assert.strictEqual(req.data.subscriptions[0].id, 'sub_1')
    })
  })

  describe('Subscriptions#GET', () => {
    it('should limit subscriptions to one page', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/subscriptions', 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/subscriptions/subscriptions-count?accountid=${user.account.accountid}`]: 3,
        [`/api/user/subscriptions/subscriptions?accountid=${user.account.accountid}&offset=0`]: [{
          id: 'sub_3',
          object: 'subscription',
          name: 'subscription'
        }, {
          id: 'sub_2',
          object: 'subscription',
          name: 'subscription'
        }]
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('subscriptions-table')
        const rows = table.getElementsByTagName('tr')
        assert.strictEqual(rows.length, global.pageSize + 1)
      }
      return req.route.api.get(req, res)
    })

    it('should enforce page size', async () => {
      global.pageSize = 3
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/subscriptions', 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/subscriptions/subscriptions-count?accountid=${user.account.accountid}`]: 4,
        [`/api/user/subscriptions/subscriptions?accountid=${user.account.accountid}&offset=0`]: [{
          id: 'sub_4',
          object: 'subscription',
          name: 'subscription'
        }, {
          id: 'sub_3',
          object: 'subscription',
          name: 'subscription'
        }, {
          id: 'sub_2',
          object: 'subscription',
          name: 'subscription'
        }]
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('subscriptions-table')
        const rows = table.getElementsByTagName('tr')
        assert.strictEqual(rows.length, global.pageSize + 1)
      }
      return req.route.api.get(req, res)
    })

    it('should enforce specified offset', async () => {
      const offset = 1
      const user = await TestHelper.createUser()
      const subscriptions = [{
        id: 'sub_3',
        object: 'subscription',
        name: 'subscription'
      }, {
        id: 'sub_2',
        object: 'subscription',
        name: 'subscription'
      }, {
        id: 'sub_1',
        object: 'subscription',
        name: 'subscription'
      }]
      const req = TestHelper.createRequest(`/subscriptions?offset=${offset}`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/subscriptions/subscriptions-count?accountid=${user.account.accountid}`]: 3,
        [`/api/user/subscriptions/subscriptions?accountid=${user.account.accountid}&offset=${offset}`]: subscriptions
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
