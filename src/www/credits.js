const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest(req) {
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  req.query.all = true
  const credits = await global.api.user.userappstore.Credits.get(req)
  if (credits && credits.length) {
    for (const credit of credits) {
      credit.amountFormatted = money(credit.amount, credit.quantity, credit.currency)
      credit.balanceFormatted = money(credit.balance, credit.quantity, credit.currency)
      credit.createdFormatted = userAppStore.Timestamp.date(credit.created)
    }
  }
  const total = await global.api.user.userappstore.CreditsCount._get(req)
  const offset = req.query.offset || 0
  req.data = { credits, total, offset }
}

async function renderPage(req, res) {
  const doc = userAppStore.HTML.parse(req.route.html)
  if (req.data.credits && req.data.credits.length) {
    userAppStore.HTML.renderTable(doc, req.data.credits, 'credit-row', 'credits-table')
    for (const credit of credits) {
      if (!credit.balance || !credit.chargeid) {
        const refundButton = doc.getElementById(`refund-credit-link-${credit.creditid}`)
        refundButton.parentNode.removeChild(refundButton)    
      }
    }
    const noCredits = doc.getElementById('no-credits')
    noCredits.parentNode.removeChild(noCredits)
  } else {
    const creditsTable = doc.getElementById('credits-table')
    creditsTable.parentNode.removeChild(creditsTable)
  }
  return res.end(doc.toString())
}

function money(amount, quantity, currency) {
  if (!currency) {
    return null
  }
  quantity = quantity || 1
  amount *= quantity
  currency = currency.toLowerCase()
  switch (currency) {
    case 'usd':
      return amount >= 0 ? `$${(amount / 100).toFixed(2)}` : `-$${(amount / -100).toFixed(2)}`
    case 'eu':
      return amount >= 0 ? `€${(amount / 100).toFixed(2)}` : `-€${(amount / -100).toFixed(2)}`
    case 'gbp':
      return amount > 0 ? `£${(amount / 100).toFixed(2)}` : `-£${(amount / -100).toFixed(2)}`
    default:
      return amount
  }
}