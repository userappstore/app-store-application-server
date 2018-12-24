window.addEventListener('load', function () {
  var fields = ['icon', 'screenshot1', 'screenshot2', 'screenshot3', 'screenshot4']
  for (let i = 0, len = fields.length; i < len; i++) {
    var preview = document.getElementById('preview-' + fields[i])
    preview.style.display = 'block'
    var input = document.getElementById('upload-' + fields[i])
    input.onchange = onSelectFileUpload
  }
})

function onSelectFileUpload (e) {
  var file = e.target.files[0]
  var filename = file.name.split('/').pop()
  var img = document.createElement('img')
  img.onload = function () {
    var info = document.getElementById('info-' + e.target.name)
    info.innerHTML = info.originalInnerHTML = info.originalInnerHTML || info.innerHTML
    var size = info.innerHTML.split(' ')[0].split('x')
    if (img.width !== +size[0] || img.height !== +size[1]) {
      info.className = 'error-message'
      return
    }
    if (e.target.name === 'icon' && filename.indexOf('.png') !== filename.length - 4) {
      info.className = 'error-message'
      return
    }
    if (e.target.name !== 'icon' && filename.indexOf('.jpg') !== filename.length - 4 && filename.indexOf('.jpeg') !== filename.length - 5) {
      info.className = 'error-message'
      return
    }
    info.className = ''
    info.innerHTML = filename
    var preview = document.getElementById('preview-' + e.target.name)
    preview.style.backgroundImage = 'url(' + img.src + ')'
  }
  img.src = window.URL.createObjectURL(file)
}
