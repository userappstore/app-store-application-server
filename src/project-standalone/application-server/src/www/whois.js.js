module.exports = {
  get: async (req, res) => {
    res.setHeader('content-type', 'text/javascript')
    return res.end('window.user = ' + JSON.stringify({
      account: req.account,
      session: req.session
    }))
  }
}