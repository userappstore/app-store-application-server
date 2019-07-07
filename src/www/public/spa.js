var contentContainer, layoutContainer, iframeContainer
var authorizationForm, signinForm
var installs
var layout
var iframe
var frames = []
var appNumber = 0

window.addEventListener('load', function (event) {
  document.body.style.overflow = 'auto'
  document.body.style.backgroundColor = '#036'
  document.getElementById('container').style.height = 'auto'
  document.title = 'UserAppStore'
  iframe = document.getElementById('application-iframe')
  iframe.parentNode.removeChild(iframe)
  parseInstallData()
  bindLinks()
  var size = {
    width: $(document.body).width(),
    height: $(document.body).height()
  }
  iframeContainer = document.getElementById('iframe-container')
  contentContainer = document.createElement('div')
  contentContainer.id = 'content-container'
  contentContainer.style.width = size.width + 'px'
  contentContainer.style.height = size.height + 'px'
  contentContainer.style.backgroundColor = '#FFF'
  document.body.style.overflow = ''
  window.addEventListener('resize', repositionOpenFrames)
  var installIndex = window.location.pathname.indexOf('/install/')
  if (installIndex > -1) {
    return openApplication(null, true)
  } else {
    return setTimeout(createContent, 1)
  }
})

function parseInstallData() {
  var appMenu = document.getElementById('app-menu-container')
  installs = {}
  if (appMenu.children.length) {
    appMenu.style.display = ''
    var appLinks = appMenu.getElementsByTagName('a')
    for (var i = 0, len = appLinks.length; i < len; i++) {
      if (appLinks[i].href && appLinks[i].href.indexOf('/install/') > -1) {
        var installid = appLinks[i].getAttribute('data-installid')
        installs[installid] = {
          organizationsEnabled: appLinks[i].getAttribute('data-organizations') === 'true',
          subscriptionsEnabled: appLinks[i].getAttribute('data-subscriptions') === 'true',
          configured: appLinks[i].getAttribute('data-configured') === 'true',
          text: appLinks[i].innerHTML
        }
      }
    }
  }
}

function bindLinks() {
  var links = document.getElementsByTagName('a')
  for (var i = 0, len = links.length; i < len; i++) {
    if (links[i].getAttribute('js') === 'false') {
      continue
    }
    if (!links[i].href ||
      links[i].href.indexOf('/account/signout') > -1) {
      continue
    }
    if (links[i].parentNode.id === 'heading') {
      links[i].onclick = closeContent
    } else {
      if (links[i].href.indexOf('/install/') > -1) {
        links[i].onclick = openApplication
      } else {
        links[i].onclick = openContent
      }
    }
  }
}

function closeContent(event) {
  if (event) {
    event.preventDefault()
  }
  contentContainer.style.display = 'none'
  if (layoutContainer) {
    layoutContainer.style.display = ''
  }
  if (iframeContainer) {
    iframeContainer.style.display = ''
  }
  return false
}

function openContent(event) {
  event.preventDefault()
  contentContainer.style.display = ''
  if (layoutContainer) {
    layoutContainer.style.display = 'none'
  }
  if (iframeContainer) {
    iframeContainer.style.display = 'none'
  }
  var newURL = (event.target.parentNode.href || event.target.href).split('://')
  if (newURL.length === 1) {
    newURL = newURL[0]
  } else {
    newURL = newURL[1].substring(newURL[1].indexOf('/'))
  }
  if (newURL === '/home') {

  }
  return Request.get(newURL, function (_, response) {
    var redirectURL = response.substring(response.indexOf(';url=') + ';url='.length)
    redirectURL = redirectURL.substring(0, redirectURL.indexOf('"'))
    if (redirectURL && redirectURL.indexOf('/account/signin') === 0) {
      if (signinForm) {
        iframe.srcdocWas = signinForm
        return createContent(null, redirectURL)
      }
      return Request.get(redirectURL, function (_, response) {
        iframe.srcdocWas = signinForm = response
        return createContent(null, redirectURL)
      })
    }
    return createContent(response, newURL)
  })
}

function frameContent(url) {
  var newFrame = document.createElement('iframe')
  newFrame.name = 'application-iframe'
  newFrame.className = 'application'
  newFrame.style.width = '100%'
  newFrame.style.height = '100%'
  newFrame.src = url
  newFrame.onload = function () {
    // make forms submit with ajax
    var forms = newFrame.contentWindow.document.getElementsByTagName('form')
    if (forms && forms.length) {
      for (i = 0, len = forms.length; i < len; i++) {
        if (forms[i].getAttribute('js') === 'false') {
          continue
        }
        forms[i].onsubmit = submitContentForm
      }
    }
    var buttons = newFrame.contentWindow.document.getElementsByTagName('button')
    if (buttons && buttons.length) {
      for (i = 0, len = buttons.length; i < len; i++) {
        if (buttons[i].getAttribute('js') === 'false') {
          continue
        }
        if (buttons[i].type === 'submit') {
          buttons[i].onclick = submitContentForm
        }
      }
    }
    var container = document.getElementById('container')
    container.style.display = ''
    // setup ajax intercepts on page links
    var links = newFrame.contentWindow.document.getElementsByTagName('a')
    for (i = 0, len = links.length; i < len; i++) {
      if (links[i].getAttribute('js') === 'false') {
        continue
      }
      if (!links[i].href ||
        links[i].href.indexOf('/account/signout') > -1 ||
        links[i].href.indexOf('/install/') > -1) {
        continue
      }
      links[i].onclick = links[i].onclick || openContent
    }
  }
  contentContainer.innerHTML = ''
  contentContainer.appendChild(newFrame)
  document.body.appendChild(contentContainer)
  if (layoutContainer) {
    layoutContainer.style.display = 'none'
  }
}

function createContent(html, url) {
  if (url && (url.indexOf('/install-app?') > -1 || url.indexOf('/confirm-subscription?') > -1 || url.indexOf('/account/subscriptions/create-billing-profile?') > -1)) {
    return frameContent(url)
  }
  var srcdoc, newTitle, navigation, newNavigation
  var navigation = document.getElementById('navigation')
  // top menus
  var accountMenuContainer = document.getElementById('account-menu-container')
  accountMenuContainer.style.display = ''
  var administratorMenuContainer = document.getElementById('administrator-menu-container')
  var administratorMenu = document.getElementById('administrator-menu')
  var isAdministrator = administratorMenu && administratorMenu.child && administratorMenu.child.length > 0
  var appMenuContainer = document.getElementById('app-menu-container')
  appMenuContainer.style.display = ''
  var collectionsMenu = document.getElementById('collections-menu')
  var ungroupedMenu = document.getElementById('ungrouped-menu')
  if (isAdministrator && administratorMenuContainer) {
    administratorMenuContainer.style.display = ''
  }
  if (html) {
    // notifications
    var notificationIndex = html.indexOf('class="notifications"')
    var notifications = html.substring(notificationIndex)
    notifications = notifications.substring(notifications.indexOf('>') + 1)
    notifications = notifications.substring(0, notifications.indexOf('</section'))
    var notificationsContainer = document.getElementById('notifications-container')
    notificationsContainer.innerHTML = notifications
    if (notifications.length) {
      var links = notificationsContainer.getElementsByTagName('a')
      if (links && links.length) {
        for (var i = 0, len = links.length; i < len; i++) {
          if (links[i].getAttribute('js') === 'false') {
            continue
          }
          links[i].onclick = openContent
        }
      }
    }
    // collections menu
    var collectionsIndex = html.indexOf('id="collections-menu"')
    var collections = html.substring(collectionsIndex)
    collections = collections.substring(collections.indexOf('>') + 1)
    collections = collections.substring(0, collections.indexOf('</div'))
    collectionsMenu.innerHTML = collections
    // ungrouped apps menu
    if (ungroupedMenu) {
      var ungroupedIndex = html.indexOf('id="ungrouped-menu"')
      var ungrouped = html.substring(ungroupedIndex)
      ungrouped = ungrouped.substring(ungrouped.indexOf('>') + 1)
      ungrouped = ungrouped.substring(0, ungrouped.indexOf('</menu'))
      ungroupedMenu.innerHTML = ungrouped
    }
    // framed content
    var srcdocIndex = html.indexOf('srcdoc="')
    if (srcdocIndex > -1) {
      srcdoc = html.substring(srcdocIndex + 'srcdoc="'.length)
      srcdoc = srcdoc.substring(0, srcdoc.lastIndexOf('></iframe>'))
      srcdoc = srcdoc.substring(0, srcdoc.lastIndexOf('"'))
      newTitle = html.substring(html.indexOf('<title>') + '<title>'.length)
      newTitle = newTitle.substring(0, newTitle.indexOf('</title>'))
      var navigationIndex = html.indexOf('<nav id="navigation">')
      if (navigationIndex > -1) {
        newNavigation = html.substring(navigationIndex + '<nav id="navigation">'.length)
        newNavigation = newNavigation.substring(0, newNavigation.indexOf('</nav>'))
        navigation.innerHTML = newNavigation
      }
    } else {
      // unframed content
      navigation.innerHTML = ''
      srcdoc = html
    }
  } else {
    srcdoc = iframe.srcdocWas
    newTitle = document.title
    if (url &&
      (url.indexOf('/account/signin') === 0)) {
      appMenuContainer.style.display = 'none'
      accountMenuContainer.style.display = 'none'
      navigation.innerHTML = ''
      if (isAdministrator && administratorMenuContainer) {
        administratorMenuContainer.style.display = 'none'
      }
    }
  }
  bindLinks()
  parseInstallData()
  collectionsMenu.style.display = collectionsMenu.children.length ? '' : 'none'
  ungroupedMenu.style.display = ungroupedMenu.children.length ? '' : 'none'
  var noInstalls = document.getElementById('no-installs')
  noInstalls.style.display = collectionsMenu.children.length + ungroupedMenu.children.length > 0 ? 'none' : ''
  var newFrame = document.createElement('iframe')
  newFrame.name = 'application-iframe'
  newFrame.className = 'application'
  newFrame.style.width = '100%'
  newFrame.style.height = '100%'
  newFrame.srcdoc = srcdoc
  newFrame.onload = function () {
    // make forms submit with ajax
    if (!url || url.indexOf('/project-ide') === -1) {
      var forms = newFrame.contentWindow.document.getElementsByTagName('form')
      if (forms && forms.length) {
        for (i = 0, len = forms.length; i < len; i++) {
          if (forms[i].getAttribute('js') === 'false') {
            continue
          }
          forms[i].onsubmit = submitContentForm
        }
      }
      var buttons = newFrame.contentWindow.document.getElementsByTagName('button')
      if (buttons && buttons.length) {
        for (i = 0, len = buttons.length; i < len; i++) {
          if (buttons[i].getAttribute('js') === 'false') {
            continue
          }
          if (buttons[i].type === 'submit') {
            buttons[i].onclick = submitContentForm
          }
        }
      }
      var container = document.getElementById('container')
      container.style.display = ''
      // setup ajax intercepts on page links
      var links = newFrame.contentWindow.document.getElementsByTagName('a')
      for (i = 0, len = links.length; i < len; i++) {
        if (links[i].getAttribute('js') === 'false') {
          continue
        }
        if (!links[i].href ||
          links[i].href.indexOf('/account/signout') > -1 ||
          links[i].href.indexOf('/install/') > -1) {
          continue
        }
        links[i].onclick = links[i].onclick || openContent
      }
    }
  }
  contentContainer.innerHTML = ''
  contentContainer.appendChild(newFrame)
  document.body.appendChild(contentContainer)
  if (layoutContainer) {
    layoutContainer.style.display = 'none'
  }
}

function submitContentForm(event) {
  event.preventDefault()
  var form = event.target
  while (form.tagName !== 'FORM') {
    form = form.parentNode
  }
  var formData = new FormData(form)
  if (event.target.tagName === 'BUTTON' &&
    event.target.name &&
    event.target.value) {
    formData.append(event.target.name, event.target.value)
  }
  var currentURL = form.action
  return Request.post(currentURL, formData, function (error, response) {
    if (error) {

    }
    if (!response) {

    }
    if (form.action.indexOf('/setup-install-profile') > -1) {
      var installid = form.action.split('installid=')[1]
      var nextVariable = installid.indexOf('&')
      if (nextVariable > -1) {
        installid = installid.substring(0, nextVariable)
      }
      installs[installid].configured = true
      event.target.href = '/install/' + installid + '/home'
      return openApplication(event, false)
    }
    iframe.srcdocWas = null
    function handleResponse(response) {
      if (response.indexOf('http-equiv="refresh"') === -1) {
        return createContent(response, currentURL)
      }
      var redirectURL = response.substring(response.indexOf(';url=') + ';url='.length)
      redirectURL = redirectURL.substring(0, redirectURL.indexOf('"'))
      currentURL = redirectURL
      if (redirectURL.indexOf('/account/signin') === 0) {
        return Request.get(currentURL, function (_, response) {
          iframe.srcdocWas = response
          return createContent(null, currentURL)
        })
      } else {
        return Request.get(currentURL, function (_, response) {
          return handleResponse(response)
        })
      }
    }
    return handleResponse(response)
  })
}

function openApplication(event, first) {
  contentContainer.style.display = 'none'
  if (layoutContainer) {
    layoutContainer.style.display = ''
  }
  if (iframeContainer) {
    iframeContainer.style.display = ''
  }
  var newURL
  if (!first) {
    event.preventDefault()
    var newURL = event.target.href.split('://')
    if (newURL.length === 1) {
      newURL = newURL[0]
    } else {
      newURL = newURL[1].substring(newURL[1].indexOf('/'))
    }
  } else {
    newURL = document.location.pathname
  }
  var installid = newURL.split('/')[2]
  var install = installs[installid]
  if (!install.configured) {
    if (layoutContainer) {
      layoutContainer.style.display = 'none'
    }
    if (iframeContainer) {
      iframeContainer.style.display = 'none'
    }
    contentContainer.style.display = ''
    return Request.get(newURL, function (error, response) {
      return createContent(response, newURL)
    })
  }
  if (first) {
    return createApplicationContent(installid)
  }
  return Request.get(newURL, function (_, response) {
    return createApplicationContent(installid, response)
  })
}

function repositionOpenFrames (event) {
  for (var i = frames.length - 1; i > -1; i--) {
    var offset = frames[i].placeholder.offset()
    if (offset.left === 0 && offset.top === 0) {
      frames[i].style.display = 'none'
      continue
    }
    frames[i].style.display = 'block'
    frames[i].style.width = frames[i].placeholder.width() + 'px'
    frames[i].style.height = (frames[i].placeholder.height()) + 'px'
    frames[i].style.top = offset.top + 'px'
    frames[i].style.left = offset.left + 'px'
  }
}

function createApplicationContent(installid, html) {
  var srcdoc, newTitle
  if (html) {
    srcdoc = html.substring(html.indexOf('srcdoc="') + 'srcdoc="'.length)
    srcdoc = srcdoc.substring(0, srcdoc.lastIndexOf('></iframe>'))
    srcdoc = srcdoc.substring(0, srcdoc.lastIndexOf('"'))
  } else {
    srcdoc = iframe.srcdocWas
  }
  var newTitle = installs[installid].text
  var newFrame = document.createElement('iframe')
  newFrame.style.position = 'absolute'
  newFrame.style.zIndex = 1
  newFrame.sandbox = 'allow-same-origin allow-popups allow-scripts allow-forms'
  newFrame.className = iframe.className
  newFrame.srcdoc = srcdoc
  appNumber++
  if (layout && !layout.root.contentItems.length) {
    layout.destroy()
    layout = null
  }
  if (!layout) {
    layout = new GoldenLayout({
      content: [{
        type: 'row',
        content: [{
          type: 'stack',
          content: [{
            type: 'component',
            title: newTitle,
            componentName: 'app-' + appNumber
          }]
        }]
      }]
    })
    layout.on('stateChanged', repositionOpenFrames)
  }
  layout.registerComponent('app-' + appNumber, function (container) {
    var placeholder = document.createElement('div')
    placeholder.id = 'app-container-' + appNumber
    placeholder.style.width = '100%'
    placeholder.style.height = '100%'
    container.getElement().append(placeholder)
    newFrame.placeholder = $(placeholder.parentNode)
    container.frame = newFrame
    frames.push(newFrame)
    iframeContainer.appendChild(newFrame)
    container.on('tab', function (tab) {
      var newMenu = document.createElement('div')
      var settingsSVG = document.getElementById('settings-svg').innerHTML
      var installMenu = document.getElementById('install-account-menu').innerHTML
      installMenu = installMenu.split('${install.installid}').join(installid).split('${install.appNumber}').join(appNumber)
      newMenu.innerHTML = settingsSVG
      var newMenuContainer = document.createElement('menu')
      newMenuContainer.innerHTML = installMenu
      newMenu.appendChild(newMenuContainer)
      newMenu.className = 'app-settings-menu'
      tab.element.append(newMenu)
      if (layoutContainer) {
        layoutContainer.style.display = ''
      }
      if (contentContainer.parentNode) {
        document.body.removeChild(contentContainer)
      }
      return setTimeout(function () {
        var install = installs[installid]
        var organizationsLink = document.getElementById('organizations-link-' + installid + '-' + appNumber)
        if (!install.organizationsEnabled) {
          organizationsLink.parentNode.removeChild(organizationsLink)
        } else {
          organizationsLink.firstChild.onclick = openContent
        }
        var subscriptionsLink = document.getElementById('subscriptions-link-' + installid + '-' + appNumber)
        if (!install.subscriptionsEnabled) {
          subscriptionsLink.parentNode.removeChild(subscriptionsLink)
        } else {
          subscriptionsLink.firstChild.onclick = openContent
        }
        var settingsLink = document.getElementById('settings-link-' + installid + '-' + appNumber)
        settingsLink.onclick = openContent
        var uninstallLink = document.getElementById('uninstall-link-' + installid + '-' + appNumber)
        uninstallLink.onclick = openContent
        var closeLink = document.getElementById('close-link-' + installid + '-' + appNumber)
        closeLink.container = container
        closeLink.onclick = closeApplication
      }, 10)
    })
    container.on('close', function () {
      repositionOpenFrames()
    })
  })
  if (!layout.isInitialised) {
    layout.init()
    layoutContainer = document.querySelector('.lm_goldenlayout')
  } else {
    layout.root.contentItems[0].addChild({
      type: 'component',
      componentName: 'app-' + appNumber,
      title: newTitle
    })
  }
}

function closeApplication(event) {
  const link = event.target
  const container = link.container
  container.close()
  frames.splice(frames.indexOf(container.frame), 1)
  container.frame.parentNode.removeChild(container.frame)
}
