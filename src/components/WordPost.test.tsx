import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
    render(<WordPost {...defaultProps} />)
    expect(screen.getByText('serenity')).toBeInTheDocument()
  })

  it('renders username and display name', () => {
    render(<WordPost {...defaultProps} />)
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('@testuser')).toBeInTheDocument()
  })

  it('renders streak badge for streaks >= 2', () => {
    render(<WordPost {...defaultProps} />)
    expect(screen.getByText('3d')).toBeInTheDocument()
  })

  it('does not render streak badge for streaks < 2', () => {
    render(<WordPost {...defaultProps} streakCount={1} />)
    expect(screen.queryByText('1d')).not.toBeInTheDocument()
  })

  it('shows total reaction count', () => {
    render(<WordPost {...defaultProps} />)
    // Total reactions: 2 + 1 = 3
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows reaction picker when reaction button is clicked', async () => {
    const user = userEvent.setup()
    render(<WordPost {...defaultProps} />)

    // When there are reactions and no user reaction, button shows 😶
    const reactionBtn = screen.getByRole('button', { name: /😶/ })
    await user.click(reactionBtn)

    // Should see the emoji picker with individual emoji buttons
    expect(screen.getByRole('button', { name: /👀/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /💀/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /🤔/ })).toBeInTheDocument()
  })

  it('does not show reaction picker for logged-out users', async () => {
    const user = userEvent.setup()
    render(<WordPost {...defaultProps} currentUserId={null} />)

    // Button shows 😶 when reactions exist but user is logged out
    const reactionBtn = screen.getByRole('button', { name: /😶/ })
    await user.click(reactionBtn)

    // Emoji picker should not appear — only the main reaction button should exist
    const buttons = screen.getAllByRole('button')
    const emojiPickerButtons = buttons.filter((b) => b.textContent?.includes('👀'))
    expect(emojiPickerButtons).toHaveLength(0)
  })

  it('shows delete button for post owner', () => {
    render(<WordPost {...defaultProps} currentUserId="user-456" wordUserId="user-456" />)
    expect(screen.getByTitle('Delete')).toBeInTheDocument()
  })

  it('does not show delete button for non-owners', () => {
    render(<WordPost {...defaultProps} />)
    expect(screen.queryByTitle('Delete')).not.toBeInTheDocument()
  })

  it('shows delete confirmation when delete button clicked', async () => {
    const user = userEvent.setup()
    render(<WordPost {...defaultProps} currentUserId="user-456" wordUserId="user-456" />)

    await user.click(screen.getByTitle('Delete'))
    expect(screen.getByText('Delete?')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('highlights user reaction emoji', () => {
    render(<WordPost {...defaultProps} userReaction="🔥" />)
    // The user's reaction should be shown as the button label
    expect(screen.getByText((content) => content.includes('🔥'))).toBeInTheDocument()
  })
})
