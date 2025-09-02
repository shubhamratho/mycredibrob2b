/**
 * Mask mobile number to show only last 4 digits
 * Example: 9876543210 becomes ******3210
 */
export function maskMobileNumber(mobileNo: string): string {
  if (!mobileNo || mobileNo.length < 4) {
    return mobileNo
  }
  
  const lastFour = mobileNo.slice(-4)
  const maskedPortion = '*'.repeat(mobileNo.length - 4)
  
  return maskedPortion + lastFour
}

/**
 * Mask email to show only first character and domain
 * Example: user@example.com becomes u***@example.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return email
  }
  
  const [username, domain] = email.split('@')
  if (username.length <= 1) {
    return email
  }
  
  const maskedUsername = username[0] + '*'.repeat(username.length - 1)
  return `${maskedUsername}@${domain}`
}

/**
 * Mask any string to show only first and last 2 characters
 * Example: "sensitive data" becomes "se*******ta"
 */
export function maskString(str: string, showFirst: number = 2, showLast: number = 2): string {
  if (!str || str.length <= showFirst + showLast) {
    return str
  }
  
  const start = str.slice(0, showFirst)
  const end = str.slice(-showLast)
  const middle = '*'.repeat(str.length - showFirst - showLast)
  
  return start + middle + end
}
