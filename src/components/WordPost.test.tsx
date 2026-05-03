import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WordPost from './WordPost'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Mock Supabase client
const mockDelete = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  }),
})
const mockInsert = vi.fn().mockResolvedValue({ error: null })

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      delete: mockDelete,
      insert: mockInsert,
    }),
  }),
}))

// Mock ShareButton
vi.mock('@/components/ShareButton', () => ({
  default: () => <button>Share</button>,
}))

describe('WordPost', () => {
  const defaultProps = {
    id: 'word-1',
    word: 'serenity',
    username: 'testuser',
    displayName: 'Test User',
    avatarUrl: null,
    createdAt: new Date().toISOString(),
    reactionCounts: { '🔥': 2, '❤️': 1 },
    userReaction: null,
    currentUserId: 'user-123',
    wordUserId: 'user-456',
    promptId: 'prompt-1',
    streakCount: 3,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the word in bold', () => {
    const view = render(<WordPost {...defaultProps} />)
    expect(view.getByText('serenity')).toBeInTheDocument()
  })

  it('renders username and display name', () => {
    const view = render(<WordPost {...defaultProps} />)
    expect(view.getByText('Test User')).toBeInTheDocument()
    expect(view.getByText('@testuser')).toBeInTheDocument()
  })

  it('renders streak badge for streaks >= 2', () => {
    const view = render(<WordPost {...defaultProps} />)
    expect(view.getByText('3d')).toBeInTheDocument()
  })

  it('does not render streak badge for streaks < 2', () => {
    const view = render(<WordPost {...defaultProps} streakCount={1} />)
    expect(view.queryByText('1d')).not.toBeInTheDocument()
  })

  it('shows total reaction count', () => {
    const view = render(<WordPost {...defaultProps} />)
    expect(view.getByText('3')).toBeInTheDocument()
  })

  it('shows reaction picker when reaction button is clicked', async () => {
    const user = userEvent.setup()
    const view = render(<WordPost {...defaultProps} />)

    const reactionBtn = view.getByRole('button', { name: /🔥/ })
    await user.click(reactionBtn)

    expect(view.getByRole('button', { name: /👀/ })).toBeInTheDocument()
    expect(view.getByRole('button', { name: /💀/ })).toBeInTheDocument()
    expect(view.getByRole('button', { name: /🤔/ })).toBeInTheDocument()
  })

  it('does not show reaction picker for logged-out users', async () => {
    const user = userEvent.setup()
    const view = render(<WordPost {...defaultProps} currentUserId={null} />)

    const reactionBtn = view.getByRole('button', { name: /🔥/ })
    await user.click(reactionBtn)

    const buttons = view.getAllByRole('button')
    const emojiPickerButtons = buttons.filter((button: HTMLElement) => button.textContent?.includes('👀'))
    expect(emojiPickerButtons).toHaveLength(0)
  })

  it('shows delete button for post owner', () => {
    const view = render(<WordPost {...defaultProps} currentUserId="user-456" wordUserId="user-456" />)
    expect(view.getByTitle('Delete')).toBeInTheDocument()
  })

  it('does not show delete button for non-owners', () => {
    const view = render(<WordPost {...defaultProps} />)
    expect(view.queryByTitle('Delete')).not.toBeInTheDocument()
  })

  it('shows delete confirmation when delete button clicked', async () => {
    const user = userEvent.setup()
    const view = render(<WordPost {...defaultProps} currentUserId="user-456" wordUserId="user-456" />)

    await user.click(view.getByTitle('Delete'))
    expect(view.getByText('Delete?')).toBeInTheDocument()
    expect(view.getByText('Yes')).toBeInTheDocument()
    expect(view.getByText('No')).toBeInTheDocument()
  })

  it('shows top reaction emoji in the compact button', () => {
    const view = render(<WordPost {...defaultProps} userReaction="❤️" />)
    expect(view.getByRole('button', { name: /🔥/ })).toBeInTheDocument()
  })
})
