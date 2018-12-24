/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/projects', () => {
  describe('Projects#BEFORE', () => {
    it('should bind projects to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createProject(user)
      await TestHelper.wait()
      const req = TestHelper.createRequest(`/projects`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.projects[0].projectid, user.project.projectid)
    })
  })

  describe('Projects#GET', () => {
    it('should limit projects to one page', async () => {
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createProject(user)
        await TestHelper.wait()
      }
      const req = TestHelper.createRequest('/projects', 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('projects-table')
        const rows = table.getElementsByTagName('tr')
        assert.strictEqual(rows.length, global.pageSize + 1)
      }
      return req.route.api.get(req, res)
    })

    it('should enforce page size', async () => {
      global.pageSize = 3
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createProject(user)
        await TestHelper.wait()
      }
      const req = TestHelper.createRequest('/projects', 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('projects-table')
        const rows = table.getElementsByTagName('tr')
        assert.strictEqual(rows.length, global.pageSize + 1)
      }
      return req.route.api.get(req, res)
    })

    it('should enforce specified offset', async () => {
      const offset = 1
      const user = await TestHelper.createUser()
      const projects = [user.project]
      for (let i = 0, len = offset + global.pageSize + 1; i < len; i++) {
        const project = await TestHelper.createProject(user)
        await TestHelper.wait()
        projects.unshift(project)
      }
      const req = TestHelper.createRequest(`/projects?offset=${offset}`, 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        for (let i = 0, len = global.pageSize; i < len; i++) {
          assert.strictEqual(doc.getElementById(projects[offset + i].projectid).tag, 'tr')
        }
      }
      return req.route.api.get(req, res)
    })
  })
})
