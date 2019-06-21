module.exports = {
  get: async (req, res) => {
    res.setHeader('content-type', 'application/json')
    return res.end('window.user = ' + JSON.stringify({
      account: req.account,
      session: req.session,
      install: req.install
    }))
  }
}