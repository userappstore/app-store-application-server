module.exports = {
  parseDate,
  date,
  money
}

/**
 * Converts USD, EU and GBP to $xx.xx or equivalent
 * @param {*} amount the units of currency
 * @param {*} currency the type of currency usd, eu or gbp
 */
function money (amount, currency) {
  if (!currency) {
    return null
  }
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

/**
 * Converts an object into a Date
 * @param {*} obj the date string or date
 */
function parseDate (obj) {
  if (!obj) {
    throw new Error('invalid-date')
  }
  if (obj.getFullYear) {
    return obj
  }
  try {
    const d = new Date(obj)
    if (d.toString() === 'Invalid Date') {
      throw new Error('invalid-date')
    }
    if (Object.prototype.toString.call(d) === '[object Date]' && d.getTime() > 0) {
      return d
    }
  } catch (e) {
    throw new Error('invalid-date')
  }
}

/**
 * Formats a date to 'YYYY-MM-DD'
 * @param {*} obj the date string or date
 */
function date (date) {
  const d = parseDate(date)
  if (!d) {
    return null
  }
  const year = d.getFullYear()
  let month = d.getMonth() + 1
  if (month < 10) {
    month = '0' + month
  }
  let day = d.getDate()
  if (day < 10) {
    day = '0' + day
  }
  return `${year}-${month}-${day}`
}
