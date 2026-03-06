/** Luhn algorithm check — returns true if the number is valid */
export function luhn(num) {
  const digits = num.replace(/\D/g, '')
  let sum = 0
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i])
    if ((digits.length - 1 - i) % 2 === 1) { d *= 2; if (d > 9) d -= 9 }
    sum += d
  }
  return sum % 10 === 0
}

/** Detect card network from prefix — returns 'Visa' | 'Mastercard' | 'Amex' | 'RuPay' | '' */
export function detectCard(num) {
  const n = num.replace(/\D/g, '')
  if (/^4/.test(n)) return 'Visa'
  if (/^5[1-5]/.test(n)) return 'Mastercard'
  if (/^3[47]/.test(n)) return 'Amex'
  if (/^6[0-9]/.test(n)) return 'RuPay'
  return ''
}

/** Format raw digits into "XXXX XXXX XXXX XXXX" groups, capped at 16 digits */
export function formatCardNumber(val) {
  const digits = val.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

/** Format raw digits into "MM/YY", capped at 4 digits */
export function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 2) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits
}

/** Format a number as an Indian Rupee string */
export function formatPrice(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN')
}
