const dashboard = require('@userappstore/dashboard')
dashboard.start(__dirname)

if (process.env.NODE_ENV === 'testing') {
  setTimeout(dashboard.stop, 1000)
}