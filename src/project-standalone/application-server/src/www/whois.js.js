module.exports = {
  get: async (req, res) => {
    res.setHeader('content-type', 'text/javascript')
    return res.end('window.user = ' + JSON.stringify({
      accountid: req.account.accountid,
      sessionid: req.session.sessionid
    }))
  }
}