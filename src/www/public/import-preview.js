var header, navbar

function onReceiveMessage (event) {
  header = header || document.getElementsByTagName('header')[0]
  navbar = header || document.getElementById('nav-bar')
  var raw = decodeURI(event.data)
  if (!raw) {
    return
  }
  var appjson
  try {
    appjson = JSON.parse(raw)
  } catch (e) {
    return
  }
  if (!appjson) {
    return
  }
  if (appjson.header) {
    if (appjson.header.backgroundColor && appjson.header.backgroundColor !== header.style.backgroundColor) {
      header.style.backgroundColor = appjson.header.backgroundColor
    }
    if (appjson.header.textColor && appjson.header.textColor !== header.style.color) {
      header.style.color = appjson.header.textColor
      header.style.fill = appjson.header.textColor
    }
  }
  if (appjson.navbar) {
    if (appjson.navbar.backgroundColor && appjson.navbar.backgroundColor !== navbar.style.backgroundColor) {
      navbar.style.backgroundColor = appjson.navbar.backgroundColor
    }
    if (appjson.navbar.textColor && appjson.navbar.textColor !== navbar.style.color) {
      navbar.style.color = appjson.navbar.textColor
    }
  }
}

window.addEventListener('message', onReceiveMessage)
