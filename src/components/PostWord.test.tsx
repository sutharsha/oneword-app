import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PostWord from './PostWord'

const refresh = vi.fn()
const mockToast = vi.fn()
const mockMatchSelect = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

vi.mock('@/components/Toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          ilike: () => ({
            neq: () => ({
              limit: () => mockMatchSelect(),
            }),
          }),
        }),
      }),
    }),
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
    mockMatchSelect.mockResolvedValue({ data: [] })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reveal: {
          word: 'blue',
          totalAnswers: 12,
          sameWordCount: 1,
          username: 'sam',
        },
      }),
    }))
  })

  it('renders the prompt question', () => {
    const view = render(<PostWord {...defaultProps} />)
    expect(view.getByText('What is your favorite color?')).toBeInTheDocument()
  })

  it('renders the input and submit button when user has not posted', () => {
    const view = render(<PostWord {...defaultProps} />)
    expect(view.getByPlaceholderText('One word...')).toBeInTheDocument()
    expect(view.getByRole('button', { name: 'Say' })).toBeInTheDocument()
  })

  it('shows the reveal panel when initial reveal data exists', () => {
    const view = render(
      <PostWord
        {...defaultProps}
        hasPostedToday={true}
        initialReveal={{
          word: 'blue',
          totalAnswers: 12,
          sameWordCount: 1,
          username: 'sam',
        }}
      />
    )

    expect(view.getByText('Unlocked')).toBeInTheDocument()
    expect(view.getByText('blue')).toBeInTheDocument()
    expect(view.getByText('Unique so far.')).toBeInTheDocument()
  })

  it('shows validation error for multiple words', async () => {
    const user = userEvent.setup()
    const view = render(<PostWord {...defaultProps} />)

    await user.type(view.getByPlaceholderText('One word...'), 'two words')
    await user.click(view.getByRole('button', { name: 'Say' }))

    expect(view.getByText('One word only.')).toBeInTheDocument()
  })

  it('submits through the API and reveals the comparison card', async () => {
    const user = userEvent.setup()
    const onPosted = vi.fn()

    const view = render(<PostWord {...defaultProps} onPosted={onPosted} />)

    await user.type(view.getByPlaceholderText('One word...'), 'Blue')
    await user.click(view.getByRole('button', { name: 'Say' }))

    expect(await view.findByText('Unlocked')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith('/api/words', expect.objectContaining({
      method: 'POST',
    }))
    expect(view.getByText('12')).toBeInTheDocument()
    expect(view.getByRole('button', { name: 'Share' })).toBeInTheDocument()
    expect(onPosted).toHaveBeenCalled()
    expect(refresh).toHaveBeenCalled()
  })

  it('shows duplicate post error on conflict response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'duplicate' }),
    }))

    const user = userEvent.setup()
    const view = render(<PostWord {...defaultProps} />)

    await user.type(view.getByPlaceholderText('One word...'), 'blue')
    await user.click(view.getByRole('button', { name: 'Say' }))

    expect(await view.findByText('You already answered today.', { selector: '.text-red-400' })).toBeInTheDocument()
  })
})
