module.exports = {
  setup: async (doc, req) => {
    const template = doc.getElementById('navbar')
    if (req.data.project.shared) {
      const shareLink = template.getElementById('navbar-share-link')
      shareLink.parentNode.removeChild(shareLink)
    } else {
      const unshareLink = template.getElementById('navbar-unshare-link')
      unshareLink.parentNode.removeChild(unshareLink)
    }
  }
}
