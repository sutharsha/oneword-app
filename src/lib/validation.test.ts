import { describe, it, expect } from 'vitest'
import { validateWord } from './validation'

describe('validateWord', () => {
  it('returns null for a valid single word', () => {
    expect(validateWord('hello')).toBeNull()
  })

  it('accepts words with apostrophes', () => {
    expect(validateWord("don't")).toBeNull()
  })

  it('accepts words with hyphens', () => {
    expect(validateWord('well-known')).toBeNull()
  })

  it('accepts uppercase letters', () => {
    expect(validateWord('Hello')).toBeNull()
  })

  it('rejects empty string', () => {
    expect(validateWord('')).toBe('Say something.')
  })

  it('rejects whitespace-only input', () => {
    expect(validateWord('   ')).toBe('Say something.')
  })

  it('rejects multiple words (spaces)', () => {
    expect(validateWord('hello world')).toBe('One word only.')
  })

  it('rejects words longer than 45 characters', () => {
    const longWord = 'a'.repeat(46)
    expect(validateWord(longWord)).toBe('Too long.')
  })

  it('accepts words exactly 45 characters', () => {
    const maxWord = 'a'.repeat(45)
    expect(validateWord(maxWord)).toBeNull()
  })

  it('rejects numbers', () => {
    expect(validateWord('hello123')).toBe('Letters only.')
  })

  it('rejects special characters', () => {
    expect(validateWord('hello!')).toBe('Letters only.')
    expect(validateWord('hello@world')).toBe('Letters only.')
    expect(validateWord('hello#')).toBe('Letters only.')
  })

  it('rejects emojis', () => {
    expect(validateWord('hello😀')).toBe('Letters only.')
  })

  it('trims whitespace before validating', () => {
    expect(validateWord('  hello  ')).toBeNull()
  })

  it('rejects string with only a space in the middle', () => {
    expect(validateWord('a b')).toBe('One word only.')
  })
})
