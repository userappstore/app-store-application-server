/* eslint-env mocha */
const assert = require('assert')
const childProcess = require('child_process')
const fs = require('fs')
const TestHelper = require('../../test-helper.js')
const UUID = require('../uuid.js')

describe('/download-project', () => {
  describe('DownloadProject#BEFORE', () => {
    it('should require projectid', async () => {
      const req = TestHelper.createRequest('/download-project?projectid=', 'GET')
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-projectid')
    })

    it('should require own projectid', async () => {
      const user1 = await TestHelper.createUser()
      const project1 = await TestHelper.createProject(user1)
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/download-project?projectid=${project1.projectid}`, 'GET')
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

    it('should bind project to req', async () => {
      const user = await TestHelper.createUser()
      const project = await TestHelper.createProject(user)
      const req = TestHelper.createRequest(`/download-project?projectid=${project.projectid}`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.project.projectid, project.projectid)
    })
  })

  describe('DownloadProject#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      const project = await TestHelper.createProject(user)
      const req = TestHelper.createRequest(`/download-project?projectid=${project.projectid}`, 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
        assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
      }
      await req.route.api.before(req)
      return req.route.api.get(req, res)
    })
  })

  describe('DownloadProject#POST', () => {
    it('should download zip file', async () => {
      const user = await TestHelper.createUser()
      const project = await TestHelper.createProject(user)

      const req = TestHelper.createRequest(`/download-project?projectid=${project.projectid}`, 'POST')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async () => {
        assert.strictEqual(res.headers['content-type'], 'application/octet-stream')
      }
      return req.route.api.post(req, res)
    })

    it('should decompress zip file', async () => {
      const user = await TestHelper.createUser()
      const project = await TestHelper.createProject(user)
      const req = TestHelper.createRequest(`/download-project?projectid=${project.projectid}`, 'POST')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (buffer) => {
        const filename = `/tmp/${UUID.v4()}.zip`
        fs.writeFileSync(filename, buffer)
        childProcess.execSync(`unzip ${filename} -d /tmp`)
        const folderName = res.headers['content-disposition'].split('"')[1].replace('.zip', '')
        let errorMessage
        try {
          childProcess.execSync(`unzip ${filename} -d /tmp/${folderName}`)
        } catch (error) {
          errorMessage = error.message
        }
        childProcess.execSync(`rm -rf /tmp/${folderName}`)
        assert.strictEqual(errorMessage, undefined)
      }
      return req.route.api.post(req, res)
    })

    it('should start standalone project server', async () => {
      const user = await TestHelper.createUser()
      const project = await TestHelper.createProject(user)
      const req = TestHelper.createRequest(`/download-project?projectid=${project.projectid}`, 'POST')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (buffer) => {
        const filename = `/tmp/${UUID.v4()}.zip`
        fs.writeFileSync(filename, buffer)
        childProcess.execSync(`unzip ${filename} -d /tmp`)
        const folderName = res.headers['content-disposition'].split('"')[1].replace('.zip', '')
        childProcess.execSync(`unzip ${filename} -d /tmp/${folderName}`)
        let errorMessage
        try {
          childProcess.execSync(`cd /tmp/${folderName} && npm install --only=production --silent`)
          childProcess.execSync(`cd /tmp/${folderName} PORT=9584 REDIS_URL=redis://redis:6379/2 node main.js`)
        } catch (error) {
          errorMessage = error.message
        }
        childProcess.execSync(`rm -rf /tmp/${folderName}`)
        assert.strictEqual(errorMessage, undefined)
      }
      return req.route.api.post(req, res)
    })
  })
})
