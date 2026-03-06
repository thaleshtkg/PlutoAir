import { describe, it, expect } from 'vitest'
import { calcAge, validateAge, buildPassengerList } from '../../../frontend/src/utils/passengerUtils'

// ---------------------------------------------------------------------------
// calcAge()
// ---------------------------------------------------------------------------
describe('calcAge()', () => {
  it('calculates exact years and months correctly', () => {
    const { years, totalMonths } = calcAge('2000-06-15', '2025-06-15')
    expect(years).toBe(25)
    expect(totalMonths).toBe(300)
  })

  it('handles birthday that has not yet occurred this year', () => {
    const { years } = calcAge('2000-12-31', '2025-06-15')
    expect(years).toBe(24)
  })

  it('returns 0 years and 0 months for a future birth date', () => {
    const { years, totalMonths } = calcAge('2030-01-01', '2025-06-15')
    expect(years).toBe(0)
    expect(totalMonths).toBe(0)
  })

  it('calculates months correctly when month wraps', () => {
    const { years, totalMonths } = calcAge('2024-10-01', '2025-06-01')
    expect(years).toBe(0)
    expect(totalMonths).toBe(8)
  })

  it('uses current date when travelDate is null', () => {
    const dob = new Date()
    dob.setFullYear(dob.getFullYear() - 5)
    const { years } = calcAge(dob.toISOString().split('T')[0], null)
    expect(years).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// validateAge()
// ---------------------------------------------------------------------------
describe('validateAge()', () => {
  const travelDate = '2025-06-15'

  it('returns empty string when dob is empty', () => {
    expect(validateAge('', 'ADULT', travelDate)).toBe('')
  })

  // ADULT
  it('passes for an adult aged exactly 12', () => {
    expect(validateAge('2013-06-15', 'ADULT', travelDate)).toBe('')
  })

  it('fails for an adult aged 11 (birthday is in July, travel is June)', () => {
    // DOB 2013-07-01, travel 2025-06-15 → 11 years old (birthday hasn't occurred yet)
    const error = validateAge('2013-07-01', 'ADULT', travelDate)
    expect(error).toMatch(/Adult must be 12\+ years/)
  })

  it('passes for an adult aged 30', () => {
    expect(validateAge('1995-01-01', 'ADULT', travelDate)).toBe('')
  })

  // CHILD
  it('passes for a child aged 5', () => {
    expect(validateAge('2020-06-15', 'CHILD', travelDate)).toBe('')
  })

  it('fails for a child aged 1 (too young)', () => {
    const error = validateAge('2024-06-15', 'CHILD', travelDate)
    expect(error).toMatch(/Child must be 2–11 years/)
  })

  it('fails for a child aged 12 (too old)', () => {
    const error = validateAge('2013-06-15', 'CHILD', travelDate)
    expect(error).toMatch(/Child must be 2–11 years/)
  })

  // NEWBORN
  it('passes for a newborn aged 10 months', () => {
    expect(validateAge('2024-08-15', 'NEWBORN', travelDate)).toBe('')
  })

  it('passes for a newborn aged exactly 23 months', () => {
    expect(validateAge('2023-07-15', 'NEWBORN', travelDate)).toBe('')
  })

  it('fails for a newborn aged 24 months (too old)', () => {
    const error = validateAge('2023-06-15', 'NEWBORN', travelDate)
    expect(error).toMatch(/Newborn must be 0–23 months/)
  })
})

// ---------------------------------------------------------------------------
// buildPassengerList()
// ---------------------------------------------------------------------------
describe('buildPassengerList()', () => {
  it('builds the correct total count', () => {
    const list = buildPassengerList(2, 1, 1)
    expect(list).toHaveLength(4)
  })

  it('assigns ADULT category to the first entries', () => {
    const list = buildPassengerList(2, 1, 0)
    expect(list[0].category).toBe('ADULT')
    expect(list[1].category).toBe('ADULT')
    expect(list[2].category).toBe('CHILD')
  })

  it('assigns NEWBORN category after children', () => {
    const list = buildPassengerList(1, 1, 1)
    expect(list[2].category).toBe('NEWBORN')
  })

  it('initialises every field to an empty string', () => {
    const list = buildPassengerList(1, 0, 0)
    const p = list[0]
    expect(p.first_name).toBe('')
    expect(p.last_name).toBe('')
    expect(p.dob).toBe('')
    expect(p.gender).toBe('')
    expect(p.nationality).toBe('')
    expect(p.passport_id).toBe('')
  })

  it('returns an empty array when all counts are 0', () => {
    expect(buildPassengerList(0, 0, 0)).toEqual([])
  })

  it('handles only adults', () => {
    const list = buildPassengerList(3, 0, 0)
    expect(list.every(p => p.category === 'ADULT')).toBe(true)
  })
})
