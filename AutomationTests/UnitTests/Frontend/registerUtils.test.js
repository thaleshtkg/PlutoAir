import { describe, it, expect } from 'vitest'
import { getPasswordStrength } from '../../../frontend/src/utils/registerUtils'

describe('getPasswordStrength()', () => {
  it('returns Weak for a very short password', () => {
    const result = getPasswordStrength('abc')
    expect(result.label).toBe('Weak')
    expect(result.width).toBe('25%')
  })

  it('returns Weak for a password that only meets the length criterion', () => {
    const result = getPasswordStrength('alllower1')
    // length>=8 (+1), digit (+1) = 2 → Fair
    // just lowercase no digit: length (+1) → 1 = Weak
    const weakResult = getPasswordStrength('alllowerr')
    expect(weakResult.label).toBe('Weak')
  })

  it('returns Fair for a password with length + 1 extra criterion', () => {
    // length >= 8 (+1), digit (+1) = score 2 → Fair
    const result = getPasswordStrength('password1')
    expect(result.label).toBe('Fair')
    expect(result.width).toBe('50%')
  })

  it('returns Strong for a password meeting 3 criteria', () => {
    // length>=8 (+1), uppercase (+1), digit (+1) = 3 → Strong
    const result = getPasswordStrength('Password1')
    expect(result.label).toBe('Strong')
    expect(result.width).toBe('75%')
  })

  it('returns Very Strong for a password meeting all 5 criteria', () => {
    // length>=8 (+1), uppercase (+1), digit (+1), special (+1), length>=12 (+1) = 5
    const result = getPasswordStrength('Password1!xyz')
    expect(result.label).toBe('Very Strong')
    expect(result.width).toBe('100%')
  })

  it('returns Very Strong for score 4 (no length>=12 bonus)', () => {
    // length>=8 (+1), uppercase (+1), digit (+1), special (+1) = 4 → Very Strong
    const result = getPasswordStrength('Pass1!xx')
    expect(result.label).toBe('Very Strong')
    expect(result.width).toBe('100%')
  })

  it('each strength level has a distinct color', () => {
    const weak      = getPasswordStrength('aaaa')
    const fair      = getPasswordStrength('password1')
    const strong    = getPasswordStrength('Password1')
    const veryStrong = getPasswordStrength('Password1!')
    expect(new Set([weak.color, fair.color, strong.color, veryStrong.color]).size).toBe(4)
  })
})
