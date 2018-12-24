/* eslint-env mocha */
const assert = require('assert')
const Storage = require('./storage.js')

describe('internal-api/storage', async () => {
  describe('Storage#read', () => {
    it('should require file', async () => {
      let errorMessage
      try {
        await Storage.read(null)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-file')
    })

    it('should return file contents', async () => {
      await Storage.write('test-read', { test: true })
      const file = await Storage.read('test-read')
      assert.strictEqual(file, '{"test":true}')
    })
  })

  describe('Storage#write()', async () => {
    it('should require file', async () => {
      let errorMessage
      try {
        await Storage.write(null, {})
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-file')
    })

    it('should require contents', async () => {
      let errorMessage
      try {
        await Storage.write('test-write', null)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-contents')
    })

    it('should accept content object', async () => {
      await Storage.write('test-object', { test: true })
      const file = await Storage.read('test-object')
      assert.strictEqual(file, '{"test":true}')
    })

    it('should accept content string', async () => {
      await Storage.write('test-object', 'string')
      const file = await Storage.read('test-object')
      assert.strictEqual(file, 'string')
    })

    it('should write file contents', async () => {
      await Storage.write('test-write', { test: true })
      const file = await Storage.read('test-write')
      assert.strictEqual(file, '{"test":true}')
    })
  })

  describe('Storage#deleteFile()', async () => {
    it('should require file', async () => {
      let errorMessage
      try {
        await Storage.deleteFile(null)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-file')
    })

    it('should delete file', async () => {
      await Storage.write('test-delete', { test: true })
      await Storage.deleteFile('test-delete')
      const file = await Storage.read(`test-delete`)
      assert.strictEqual(file, undefined)
    })
  })
})
