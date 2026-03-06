import { describe, it, expect } from 'vitest'
import { luhn, detectCard, formatCardNumber, formatExpiry, formatPrice } from '../../../frontend/src/utils/paymentUtils'

// ---------------------------------------------------------------------------
// luhn()
// ---------------------------------------------------------------------------
describe('luhn()', () => {
  it('returns true for a valid Visa test number', () => {
    expect(luhn('4111111111111111')).toBe(true)
  })

  it('returns true for a valid Mastercard test number', () => {
    expect(luhn('5500005555555559')).toBe(true)
  })

  it('returns false for an invalid number', () => {
    expect(luhn('1234567890123456')).toBe(false)
  })

  it('strips spaces and dashes before checking', () => {
    expect(luhn('4111 1111 1111 1111')).toBe(true)
    expect(luhn('4111-1111-1111-1111')).toBe(true)
  })

  it('returns true for an empty string (sum is 0, 0 mod 10 === 0)', () => {
    // The raw Luhn algorithm returns true for empty input because sum=0.
    // Real-world code should validate length separately before calling luhn().
    expect(luhn('')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// detectCard()
// ---------------------------------------------------------------------------
describe('detectCard()', () => {
  it('detects Visa from prefix 4', () => {
    expect(detectCard('4111111111111111')).toBe('Visa')
  })

  it('detects Mastercard from prefix 51–55', () => {
    expect(detectCard('5100000000000000')).toBe('Mastercard')
    expect(detectCard('5500000000000000')).toBe('Mastercard')
  })

  it('detects Amex from prefix 34 and 37', () => {
    expect(detectCard('341111111111111')).toBe('Amex')
    expect(detectCard('371111111111111')).toBe('Amex')
  })

  it('detects RuPay from prefix 60–69', () => {
    expect(detectCard('6011111111111117')).toBe('RuPay')
    expect(detectCard('6521111111111117')).toBe('RuPay')
  })

  it('returns empty string for unknown prefix', () => {
    expect(detectCard('9000000000000000')).toBe('')
  })

  it('works with formatted input containing spaces', () => {
    expect(detectCard('4111 1111 1111 1111')).toBe('Visa')
  })
})

// ---------------------------------------------------------------------------
// formatCardNumber()
// ---------------------------------------------------------------------------
describe('formatCardNumber()', () => {
  it('formats a 16-digit string into four groups of 4', () => {
    expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111')
  })

  it('strips non-digit characters before formatting', () => {
    expect(formatCardNumber('4111-1111-1111-1111')).toBe('4111 1111 1111 1111')
  })

  it('truncates input beyond 16 digits', () => {
    expect(formatCardNumber('41111111111111119999')).toBe('4111 1111 1111 1111')
  })

  it('handles partial input (fewer than 4 digits)', () => {
    expect(formatCardNumber('411')).toBe('411')
  })

  it('handles partial input (5 digits)', () => {
    expect(formatCardNumber('41111')).toBe('4111 1')
  })

  it('returns empty string for empty input', () => {
    expect(formatCardNumber('')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// formatExpiry()
// ---------------------------------------------------------------------------
describe('formatExpiry()', () => {
  it('inserts slash after the second digit', () => {
    expect(formatExpiry('1225')).toBe('12/25')
  })

  it('handles partially typed month (1 digit)', () => {
    expect(formatExpiry('1')).toBe('1')
  })

  it('handles exactly 2 digits', () => {
    expect(formatExpiry('12')).toBe('12/')
  })

  it('strips non-digit characters before formatting', () => {
    expect(formatExpiry('12/25')).toBe('12/25')
  })

  it('truncates beyond 4 digits', () => {
    expect(formatExpiry('122599')).toBe('12/25')
  })

  it('returns empty string for empty input', () => {
    expect(formatExpiry('')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// formatPrice()
// ---------------------------------------------------------------------------
describe('formatPrice()', () => {
  it('formats a positive integer in Indian locale', () => {
    expect(formatPrice(1000)).toBe('₹1,000')
  })

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('₹0')
  })

  it('handles null / undefined gracefully (defaults to 0)', () => {
    expect(formatPrice(null)).toBe('₹0')
    expect(formatPrice(undefined)).toBe('₹0')
  })

  it('formats a large number with correct grouping', () => {
    expect(formatPrice(100000)).toBe('₹1,00,000')
  })
})
