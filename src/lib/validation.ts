/**
 * Validates a word input for posting.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateWord(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return 'Say something.'
  if (trimmed.includes(' ')) return 'One word only.'
  if (trimmed.length > 45) return 'Too long.'
  if (!/^[a-zA-Z'\-]+$/.test(trimmed)) return 'Letters only.'
  return null
}
