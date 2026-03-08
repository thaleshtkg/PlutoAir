/**
 * Calculate age (years and total months) at the given travel date.
 * @param {string} dob - ISO date string
 * @param {string|null} travelDate - ISO date string (defaults to now)
 * @returns {{ years: number, totalMonths: number }}
 */
export function calcAge(dob, travelDate) {
  const travel = new Date(travelDate || Date.now())
  const birth = new Date(dob)
  let years = travel.getFullYear() - birth.getFullYear()
  let months = travel.getMonth() - birth.getMonth()
  if (months < 0) { years--; months += 12 }
  const totalMonths = years * 12 + months
  return { years: years < 0 ? 0 : years, totalMonths: totalMonths < 0 ? 0 : totalMonths }
}

/**
 * Validate that a passenger's DOB fits the given category.
 * @param {string} dob - ISO date string
 * @param {'ADULT'|'CHILD'|'NEWBORN'} category
 * @param {string|null} travelDate
 * @returns {string} error message, or '' if valid
 */
export function validateAge(dob, category, travelDate) {
  if (!dob) return 'Date of birth is required'
  const { years, totalMonths } = calcAge(dob, travelDate)
  if (category === 'ADULT' && years < 12) return 'Passenger age does not match the selected category. Adult must be 12+ years.'
  if (category === 'CHILD' && (years < 2 || years > 11)) return 'Passenger age does not match the selected category. Child must be 2–11 years.'
  if (category === 'NEWBORN' && totalMonths > 23) return 'Passenger age does not match the selected category. Newborn must be 0–23 months.'
  return ''
}

/**
 * Build an initial empty passenger list based on counts.
 * @param {number} adults
 * @param {number} children
 * @param {number} newborns
 * @returns {Array<object>}
 */
export function buildPassengerList(adults, children, newborns) {
  const list = []
  for (let i = 0; i < adults; i++) list.push({ category: 'ADULT', first_name: '', last_name: '', dob: '', gender: '', nationality: '', passport_id: '' })
  for (let i = 0; i < children; i++) list.push({ category: 'CHILD', first_name: '', last_name: '', dob: '', gender: '', nationality: '', passport_id: '' })
  for (let i = 0; i < newborns; i++) list.push({ category: 'NEWBORN', first_name: '', last_name: '', dob: '', gender: '', nationality: '', passport_id: '' })
  return list
}
