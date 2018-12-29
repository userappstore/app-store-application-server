const fs = require('fs')
const os = require('os')
const path = require('path')
const ServerHTML = require('server-html')
const UglifyJS = require('uglify-js')
const UUID = require('./uuid.js')

module.exports = {
  createCopy,
  parse,
  minify,
  findOrCreateTableBody,
  setSelectedOptionByValue,
  renderList,
  renderPagination,
  renderTable,
  renderTemplate
}

function minify (doc) {
  if (!doc) {
    throw new Error('invalid-document')
  }
  const scripts = doc.getElementsByTagName('script')
  if (!scripts || !scripts.length) {
    return doc
  }
  for (const script of scripts) {
    if (script.attr && script.attr.src) {
      continue
    }
    if (script.child && script.child.length) {
      const js = []
      for (const child of script.child) {
        if (child.node === 'text') {
          js.push(child.text || '')
        }
      }
      script.child = [{
        node: 'text',
        text: UglifyJS.minify(js.join('\n')).code
      }]
    }
  }
  return doc
}

function parse (fileOrHTML, dataObject, dataObjectName) {
  if (!fileOrHTML) {
    throw new Error('invalid-html')
  }
  let doc
  if (fileOrHTML.indexOf('/') === 0) {
    const filePath = path.join(global.rootPath, fileOrHTML)
    doc = ServerHTML.parseFile(filePath)
  } else {
    doc = ServerHTML.parse(fileOrHTML)
  }
  if (!doc) {
    throw new Error('invalid-html')
  }
  if (dataObject) {
    doc = createCopy(dataObject, dataObjectName, doc)
  }
  if (doc.child[0].tag === 'html') {
    doc = doc.child[0]
  }
  const htmlTag = doc.tag === 'html' ? doc : null
  if (htmlTag && htmlTag.attr && htmlTag.attr.navbar) {
    let navbarPath = path.join(global.rootPath, htmlTag.attr.navbar)
    if (navbarPath) {
      const navbarHTML = fs.readFileSync(navbarPath).toString('utf-8')
      if (navbarHTML) {
        let template = doc.getElementById('navbar') || doc.createElement('template')
        template.attr = template.attr || {}
        template.attr.id = 'navbar'
        template.child = [{
          node: 'text',
          text: navbarHTML
        }]
        if (dataObject) {
          const newTemplate = createCopy(dataObject, dataObjectName, template)
          htmlTag.appendChild(newTemplate.child[0])
        } else {
          htmlTag.appendChild(template)
        }
      }
    }
  }
  return minify(doc)
}

function setSelectedOptionByValue (doc, elementid, value) {
  if (!doc) {
    throw new Error('invalid-document')
  }
  if (!elementid) {
    throw new Error('invalid-elementid')
  }
  const select = elementid.substring ? doc.getElementById(elementid) : elementid
  if (!select.child || !select.child.length) {
    return
  }
  for (const option of select.child) {
    if (option.attr && option.attr.value === value) {
      option.attr.selected = 'selected'
    }
  }
}

function renderList (doc, dataSet, template, parent) {
  if (!doc) {
    throw new Error('invalid-document')
  }
  if (!dataSet || !dataSet.length) {
    throw new Error('invalid-data')
  }
  if (!template) {
    throw new Error('invalid-template')
  }
  if (!parent) {
    throw new Error('invalid-parent')
  }
  let templateName
  if (template.substring) {
    templateName = template
    template = doc.getElementById(template)
  } else {
    templateName = template ? template.attr.id : null
  }
  if (parent.substring) {
    parent = doc.getElementById(parent)
  }
  template.attr = template.attr || {}
  template.attr.template = templateName
  const itemHTML = template.child[0].toString()
  parent.child = parent.child || []
  for (let i = 0, len = dataSet.length; i < len; i++) {
    const dataObject = dataSet[i]
    let li = parse(itemHTML, dataObject, dataObject.object)
    if (parent.child.length % 2 === 0) {
      li.attr = li.attr || {}
      li.attr.class = li.attr.class || ''
      li.attr.class = (li.attr.class + ' alt').trim()
    }
    parent.child = parent.child.concat(li.child)
  }
}

function renderTemplate (doc, dataObject, template, parent) {
  if (!doc) {
    throw new Error('invalid-document')
  }
  if (!template) {
    throw new Error('invalid-template')
  }
  if (!parent) {
    throw new Error('invalid-parent')
  }
  let templateName
  if (template.substring) {
    templateName = template
    template = doc.getElementById(template)
    if (!template) {
      if (process.env.DEBUG_ERRORS) {
        console.log('missing template', templateName, template)
      }
      throw new Error('invalid-template')
    }
  } else {
    templateName = template.attr.id
  }
  if (parent.substring) {
    parent = doc.getElementById(parent)
  }
  let templateHTML = template.toString()
  templateHTML = templateHTML.substring(templateHTML.indexOf('>') + 1)
  templateHTML = templateHTML.substring(0, templateHTML.lastIndexOf('</template>'))
  let newItem = parse(templateHTML, dataObject, dataObject ? dataObject.object : null)
  if (!newItem) {
    throw new Error('invalid-template')
  }
  if (newItem.tag === 'template') {
    if (newItem.child.length) {
      for (const child of newItem.child) {
        child.attr = child.attr || {}
        child.attr.template = templateName
      }
      parent.child = parent.child || []
      parent.child = parent.child.concat(newItem.child)
    }
  } else {
    newItem.attr = newItem.attr || {}
    newItem.attr.template = templateName
    parent.child = parent.child || []
    parent.appendChild(newItem)
  }
}

function renderTable (doc, dataSet, template, parent) {
  if (!doc) {
    throw new Error('invalid-document')
  }
  if (!dataSet || !dataSet.length) {
    throw new Error('invalid-data')
  }
  if (!template) {
    throw new Error('invalid-template')
  }
  if (!parent) {
    throw new Error('invalid-parent')
  }
  let templateName
  if (template.substring) {
    templateName = template
    template = doc.getElementById(template)
  } else {
    templateName = template ? template.attr.id : null
  }
  if (!template) {
    return null
  }
  if (parent.substring) {
    parent = doc.getElementById(parent)
  }
  template.attr = template.attr || {}
  template.attr.template = templateName
  const rowHTML = template.child[0].toString()
  const tbody = findOrCreateTableBody(doc, parent)
  for (let i = 0, len = dataSet.length; i < len; i++) {
    const dataObject = dataSet[i]
    const row = parse(rowHTML, dataObject, dataObject.object)
    if (tbody.child.length % 2 === 0) {
      row.attr = row.attr || {}
      row.attr.class = row.attr.class || ''
      row.attr.class = (row.attr.class + ' alt').trim()
    }
    tbody.child = tbody.child.concat(row.child)
  }
}

function findOrCreateTableBody (doc, table) {
  if (!doc) {
    throw new Error('invalid-document')
  }
  if (!table) {
    throw new Error('invalid-table')
  }
  if (table.substring) {
    table = doc.getElementById(table)
    if (!table) {
      throw new Error('invalid-table')
    }
  }
  table.child = table.child || []
  let tbody = table.getElementsByTagName('tbody')
  if (!tbody || !tbody.length) {
    tbody = doc.createElement('tbody')
    table.appendChild(tbody)
  } else {
    tbody = tbody[0]
  }
  return tbody
}

function renderPagination (doc, offset, total, pageSize) {
  if (!doc) {
    throw new Error('invalid-document')
  }
  total = total || 0
  if (total === 0) {
    throw new Error('invalid-total')
  }
  offset = offset || 0
  pageSize = pageSize || global.pageSize
  if (offset >= total) {
    throw new Error('invalid-total')
  }
  const numPages = Math.ceil(total / pageSize)
  const pageLinks = []
  for (let i = 0, len = numPages; i < len; i++) {
    pageLinks.push({ object: 'page', offset: (i * pageSize), pageNumber: i + 1 })
  }
  renderList(doc, pageLinks, 'page-link', 'page-links')
  // remove ?offset=0
  const first = doc.getElementById(`page-link-1`)
  if (first) {
    first.attr.href = first.attr.href.substring(0, first.attr.href.indexOf('?offset=0'))
  } else {
    return
  }
  // set current page
  let currentPage = Math.ceil(offset / pageSize) + 1
  if (currentPage === 1) {
    return first.classList.add('current-page')
  }
  doc.getElementById(`page-link-${currentPage}`).classList.add('current-page')
}

function createCopy (dataObject, dataObjectName, element) {
  let templates
  if (element.tag === 'html') {
    templates = element.getElementsByTagName('template')
    if (templates && templates.length) {
      for (const template of templates) {
        template.parentWas = template.parentNode
        template.parentNode.removeChild(template)
      }
    }
  }
  let docStr = element.toString()
  dataObjectName = dataObjectName || 'data'
  const wrapper = 'const ' + dataObjectName + ' = ' + JSON.stringify(dataObject) + ';\n' +
                  'module.exports = `<template>' + docStr + '</template>`'
  const tempPath = os.tmpdir() + '/' + UUID.random(64)
  fs.writeFileSync(tempPath, wrapper)
  let formatted
  try {
    formatted = require(tempPath)
  } catch (error) {
    console.log('[html]', error.message)
  }
  fs.unlinkSync(tempPath)
  if (!formatted) {
    throw new Error('invalid-html')
  }
  let newElement = ServerHTML.parse(formatted)
  if (!newElement) {
    throw new Error('invalid-html')
  }
  if (templates && templates.length) {
    for (const template of templates) {
      newElement.child[0].appendChild(template)
    }
  }
  return newElement
}
