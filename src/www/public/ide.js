var projectid, filename, submitForm
var linkids = [ 'home.html-link', 'app.css-link', 'app.js-link' ]
var inputids = [ 'home.html', 'app.css', 'app.js' ]
var statusids = [ 'home.html-status', 'app.css-status', 'app.js-status' ]
var editors = {}
var links = {}
var statuses = {}
var lastSent = {}
var layout
var previewFrame
var nextAutoSave = (new Date().getTime() / 1000) + 1

window.addEventListener('load', startIDE)

function startIDE() {
  window.removeEventListener('load', startIDE)
  projectid = window.projectid
  filename = window.filename
  submitForm = document.getElementById('submit-form')
  submitForm.onsubmit = saveChangedFiles
  for (var i = 0, len = linkids.length; i < len; i++) {
    var link = document.getElementById(linkids[i])
    link.onclick = switchEditor
    links[linkids[i]] = link
    var status = document.getElementById(statusids[i])
    statuses[statusids[i]] = status
  }
  var homeHTML = decodeURI(document.getElementById('home.html').value)
  lastSent['home.html'] = homeHTML
  var appCSS = decodeURI(document.getElementById('app.css').value)
  lastSent['app.css'] = appCSS
  var appJS = decodeURI(document.getElementById('app.js').value)
  lastSent['app.js'] = appJS
  window.parent.postMessage('home.html=' + homeHTML, '*')
  window.parent.postMessage('app.css=' + appCSS, '*')
  window.parent.postMessage('app.js=' + appJS, '*')
  switchEditor({target: links[filename + '-link']})
  layout = new GoldenLayout({
    content: [{
      type: 'row',
      content: [{
        type: 'stack',
        content: [{
          type: 'component',
          title: 'Project IDE',
          componentName: 'ide'
        }]
      }, {
        type: 'stack',
        content: [{
          type: 'component',
          title: 'Project preview',
          componentName: 'preview'
        }]
      }]
    }]
  })
  layout.registerComponent('ide', function (container) {
    const navigationForm = document.getElementById('submit-form')
    var containerElement = container.getElement()
    containerElement.append(navigationForm)
  })
  layout.registerComponent('preview', function (container) {
    previewFrame = document.createElement('iframe')
    previewFrame.frameBorder = 0
    previewFrame.style.backgroundColor = '#FFF'
    previewFrame.sandbox = 'allow-top-navigation allow-scripts allow-forms allow-same-origin allow-popups'
    previewFrame.width = '100%'
    previewFrame.height = '100%'
    updatePreview()
    const navigationForm = document.getElementById('preview-form')
    navigationForm.onsubmit = updatePreview
    var containerElement = container.getElement()
    containerElement.append(navigationForm)
    containerElement.append(previewFrame)
  })
  layout.init()
  setInterval(toggleUnsavedMark, 100)
  return setInterval(autoSaveChanges, 1000)
}

function autoSaveChanges (e) {
  saveChangedFiles(null)
}

function updatePreview (e) {
  if (e && e.preventDefault) {
    e.preventDefault()
  }
  var html = lastSent['home.html'] || ''
  if(html) {
    if (lastSent['app.css']) {
      html += '<style>' + lastSent['app.css'] + '</style>'
    }
    if (lastSent['app.js']) {
      html += '<script>' + lastSent['app.js'] + '</script>'
    }
    if (html !== previewFrame.srcdoc) {
      previewFrame.srcdoc = html
    }
  }
}

function toggleUnsavedMark (e) {
  for (var i = 0, len = inputids.length; i < len; i++) {
    var filename = inputids[i]
    var editor = editors[filename]
    if (!editor) {
      continue
    }
    var status = statuses[statusids[i]]
    if (lastSent[filename] === editor.getValue().toString()) {
      status.className = 'saved'
    } else {
      status.className = 'unsaved'
    }
  }
}

function saveChangedFiles (e) {
  var now = new Date().getTime() / 1000
  if (now < nextAutoSave) {
    return
  }
  nextAutoSave += 2
  if (e && e.preventDefault) {
    e.preventDefault()
  }
  var sending = 0
  var postData = {}
  for (var i = 0, len = linkids.length; i < len; i++) {
    var filename = inputids[i]
    var editor = editors[filename]
    if (!editor) {
      continue
    }
    var newValue = editor.getValue().toString() || ''
    if (lastSent[filename] === newValue) {
      continue
    }
    sending++
    lastSent[filename] = newValue
    postData[filename] = encodeURI(newValue).split('+').join('%2B')
  }
  if (sending === 0) {
    return
  }
  return window.Request.post('/project-ide?projectid=' + projectid, postData)
}

function switchEditor (e) {
  var filenames = ['home.html', 'app.css', 'app.js']
  var linkids = ['home.html-link', 'app.css-link', 'app.js-link']
  for (var i = 0, len = linkids.length; i < len; i++) {
    var link = links[linkids[i]]
    if (link.id !== e.target.id) {
      link.className = ''
      document.getElementById(filenames[i] + '-editor').style.display = 'none'
      continue
    }
    link.className = 'current'
    filename = filenames[i]
    var editor = editors[filename]
    if (editor) {
      editor.container.style.display = ''
      continue
    }
    var Mode
    switch (filename) {
      case 'home.html':
        Mode = window.ace.require('ace/mode/html').Mode
        break
      case 'app.css':
        Mode = window.ace.require('ace/mode/css').Mode
        break
      case 'app.js':
        Mode = window.ace.require('ace/mode/javascript').Mode
        break
    }
    editor = window.ace.edit(filename + '-editor')
    editor.$blockScrolling = Infinity
    editor.setTheme('ace/theme/twilight')
    editor.session.setMode(new Mode())
    editor.setValue(decodeURI(document.getElementById(filename).innerHTML), -1)
    editor.setShowPrintMargin(false)
    editor.getSession().on('change', saveChangedFiles)
    editor.container.style.display = ''
    editors[filename] = editor
  }
  if (e.preventDefault) {
    e.preventDefault()
  }
  window.parent.postMessage('edit=' + filename, '*')
  return false
}
