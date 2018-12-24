const Storage = require('./storage.js')

module.exports = {
  getProperties,
  getProperty,
  removeProperty,
  removeProperties,
  setProperty,
  setProperties
}

/**
 * Retrieves multiple property from the object
 * @param {string} objectid - the object
 * @param {string} array - array of properties
 */
async function getProperties(objectid, array) {
  if (!objectid || !objectid.length) {
    throw new Error('invalid-objectid')
  }
  if (!array || !array.length) {
    throw new Error('invalid-array')
  }
  let data = await Storage.read(objectid, array)
  if (!data || !data.length) {
    return
  }
  data = JSON.parse(data)
  const object = {}
  for (const key in data) {
    if (array.indexOf(key) === -1) {
      continue
    }
    object[key] = value
  }
  return object
}

/**
 * Retrieves a property from the object
 * @param {string} objectid - the object
 * @param {string} property - name of property
 */
async function getProperty(objectid, property) {
  if (!objectid || !objectid.length) {
    throw new Error('invalid-objectid')
  }
  if (!property || !property.length) {
    throw new Error('invalid-property')
  }
  let data = await Storage.read(objectid)
  if (!data || !data.length) {
    return
  }
  data = JSON.parse(data)
  let value = data[property]
  if (value === undefined || value === null) {
    return
  }
  return value
}

/**
 * Attaches multiple properties and values to the object
 * @param {string} objectid - the object
 * @param {string} hash - hash of properties
 */
async function setProperties(objectid, properties) {
  if (!objectid || !objectid.length) {
    throw new Error('invalid-objectid')
  }
  if (!properties) {
    throw new Error('invalid-properties')
  }
  const keys = Object.keys(properties)
  if (!keys.length) {
    throw new Error('invalid-properties')
  }
  let data = await Storage.read(objectid) || '{}'
  data = JSON.parse(data)
  for (const property in properties) {
    if (properties[property] === undefined || properties[property] === null || properties[property] === '') {
      delete (data[property])
    } else {
      data[property] = properties[property]
    }
  }
  return Storage.write(objectid, data)
}

/**
 * Attaches a property and value to the object
 * @param {string} objectid - the object
 * @param {string} property - the field
 * @param {string} value - the value
 */
async function setProperty(objectid, property, value) {
  if (!objectid || !objectid.length) {
    throw new Error('invalid-objectid')
  }
  if (!property || !property.length) {
    throw new Error('invalid-property')
  }
  if (value == null || value === undefined) {
    throw new Error('invalid-value')
  }
  let data = await Storage.read(objectid) || '{}'
  data = JSON.parse(data)
  data[property] = value
  return Storage.write(objectid, data)
}

/**
 * Removes multiple properties from the object
 * @param {string} objectid - the object
 * @param {string} array - array of properties
 */
async function removeProperties(objectid, array) {
  if (!objectid || !objectid.length) {
    throw new Error('invalid-objectid')
  }
  if (!array || !array.length) {
    throw new Error('invalid-array')
  }
  let data = await Storage.read(objectid)
  if (!data) {
    return
  }
  data = JSON.parse(data)
  for (const item of array) {
    delete (data[item])
  }
  return Storage.write(objectid, data)
}

/**
 * Removes a property from the object
 * @param {string} objectid - the object
 * @param {string} property - the field
 */
async function removeProperty(objectid, property) {
  if (!objectid || !objectid.length) {
    throw new Error('invalid-objectid')
  }
  if (!property || !property.length) {
    throw new Error('invalid-property')
  }
  let data = await Storage.read(objectid)
  if (!data) {
    return
  }
  data = JSON.parse(data)
  delete (data[property])
  return Storage.write(objectid, data)
}
