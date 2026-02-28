import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PostWord from './PostWord'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

// Mock supabase client
const mockInsert = vi.fn()
const mockDelete = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'words') {
        return {
          insert: mockInsert,
          delete: () => ({
            eq: () => ({
              eq: mockDelete,
            }),
          }),
        }
      }
      return {}
    },
  }),
}))

describe('PostWord', () => {
  const defaultProps = {
    userId: 'user-123',
    promptId: 'prompt-456',
    promptQuestion: 'What is your favorite color?',
    hasPostedToday: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
  })

  it('renders the prompt question', () => {
    render(<PostWord {...defaultProps} />)
    expect(screen.getByText('What is your favorite color?')).toBeInTheDocument()
  })

  it('renders the input and submit button when user has not posted', () => {
    render(<PostWord {...defaultProps} />)
    expect(screen.getByPlaceholderText('One word...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Say' })).toBeInTheDocument()
  })

  it('shows "already answered" message when hasPostedToday is true', () => {
    render(<PostWord {...defaultProps} hasPostedToday={true} />)
    expect(screen.getByText('You already answered today.')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('One word...')).not.toBeInTheDocument()
  })

  it('disables submit button when input is empty', () => {
    render(<PostWord {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Say' })).toBeDisabled()
  })

  it('enables submit button when input has text', async () => {
    const user = userEvent.setup()
    render(<PostWord {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('One word...'), 'blue')
    expect(screen.getByRole('button', { name: 'Say' })).toBeEnabled()
  })

  it('shows validation error for multiple words', async () => {
    const user = userEvent.setup()
    render(<PostWord {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('One word...'), 'two words')
    await user.click(screen.getByRole('button', { name: 'Say' }))

    expect(screen.getByText('One word only.')).toBeInTheDocument()
  })

  it('shows validation error for special characters', async () => {
    const user = userEvent.setup()
    render(<PostWord {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('One word...'), 'hello!')
    await user.click(screen.getByRole('button', { name: 'Say' }))

    expect(screen.getByText('Letters only.')).toBeInTheDocument()
  })

  it('clears error when user types', async () => {
    const user = userEvent.setup()
    render(<PostWord {...defaultProps} />)

    // Trigger an error
    await user.type(screen.getByPlaceholderText('One word...'), 'two words')
    await user.click(screen.getByRole('button', { name: 'Say' }))
    expect(screen.getByText('One word only.')).toBeInTheDocument()

    // Type something new — error should clear
    await user.type(screen.getByPlaceholderText('One word...'), 'x')
    expect(screen.queryByText('One word only.')).not.toBeInTheDocument()
  })

  it('calls supabase insert on valid submission', async () => {
    const user = userEvent.setup()
    render(<PostWord {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('One word...'), 'blue')
    await user.click(screen.getByRole('button', { name: 'Say' }))

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user-123',
      word: 'blue',
      prompt_id: 'prompt-456',
    })
  })

  it('shows duplicate post error on constraint violation', async () => {
    mockInsert.mockResolvedValue({
      error: { code: '23505', message: 'duplicate' },
    })

    const user = userEvent.setup()
    render(<PostWord {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('One word...'), 'blue')
    await user.click(screen.getByRole('button', { name: 'Say' }))

    // Both the status text and error text appear — check error element specifically
    const errorEl = screen.getByText('You already answered today.', {
      selector: '.text-red-400',
    })
    expect(errorEl).toBeInTheDocument()
  })
})
