module.exports = {
  get: (req, res) => {
    const user = {
      sessionid: req.session.sessionid,
      profileid: req.account.profileid,
      url: `${process.env.DASHBOARD_SERVER}/project/${req.query.projectid}/home`,
      root: `${process.env.DASHBOARD_SERVER}/project/${req.query.projectid}/`
    }
    res.setHeader('content-type', 'application/javascript')
    res.end(`user = ${JSON.stringify(user)}`)
  }
}
