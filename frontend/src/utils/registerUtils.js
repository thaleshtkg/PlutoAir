/**
 * Calculate password strength score and return display metadata.
 * @param {string} password
 * @returns {{ label: string, color: string, width: string }}
 */
export function getPasswordStrength(password) {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (password.length >= 12) score++
  if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: '25%' }
  if (score === 2) return { label: 'Fair', color: 'bg-orange-400', width: '50%' }
  if (score === 3) return { label: 'Strong', color: 'bg-yellow-400', width: '75%' }
  return { label: 'Very Strong', color: 'bg-green-500', width: '100%' }
}
