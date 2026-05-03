'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import PostWord from '@/components/PostWord'
import AnonPostWord from '@/components/AnonPostWord'
import PromptTimer from '@/components/PromptTimer'
import WordPost from '@/components/WordPost'
import FeedSkeleton from '@/components/FeedSkeleton'
import type { FeedData, FilterType } from '@/lib/feed'

const FILTERS: { key: FilterType; label: string; authOnly?: boolean }[] = [
  { key: 'today', label: 'Today' },
  { key: 'popular', label: 'Popular' },
  { key: 'week', label: 'This Week' },
  { key: 'following', label: 'Following', authOnly: true },
  { key: 'all', label: 'All Time' },
]

function FeedContent({ data }: { data: FeedData }) {
  const user = data.user
  const todaysPrompt = data.todaysPrompt

  return (
    <>
      {user && (
        <PostWord
          userId={user.id}
          promptId={todaysPrompt?.id || null}
          promptQuestion={todaysPrompt?.question || null}
          hasPostedToday={data.hasPostedToday}
          initialReveal={data.todaysReveal ? {
            word: data.todaysReveal.userWord,
            totalAnswers: data.todaysReveal.totalAnswers,
            sameWordCount: data.todaysReveal.sameWordCount,
            sameWordMatches: data.todaysReveal.sameWordMatches,
            username: data.todaysReveal.username,
          } : null}
        />
      )}

      {!user && todaysPrompt && (
        <AnonPostWord
          promptId={todaysPrompt.id}
          promptQuestion={todaysPrompt.question}
        />
      )}

      {data.filter === 'today' && todaysPrompt && (
        <div className="px-4 pb-2 flex justify-end">
          <PromptTimer />
        </div>
      )}

      {data.followingEmpty ? (
        <div className="p-8 text-center text-zinc-500">
          <p className="text-4xl mb-3">👋</p>
          <p className="text-lg font-semibold">No one followed yet.</p>
          <p className="text-sm mt-1">Follow people to see their words here.</p>
        </div>
      ) : (
        <div>
          {data.words.length > 0 ? (
            data.words.map((w) => (
              <WordPost
                key={w.id}
                id={w.id}
                word={w.word}
                username={w.username}
                displayName={w.displayName}
                avatarUrl={w.avatarUrl}
                createdAt={w.createdAt}
                reactionCounts={w.reactionCounts}
                userReaction={w.userReaction}
                currentUserId={w.currentUserId}
                wordUserId={w.wordUserId}
                promptId={w.promptId}
                streakCount={w.streakCount}
                isCrowned={w.isCrowned}
              />
            ))
          ) : (
            <div className="p-8 text-center text-zinc-500">
              <p className="text-4xl mb-3">🤫</p>
              <p className="text-lg font-semibold">Silence.</p>
              <p className="text-sm mt-1">Be the first to say something.</p>
            </div>
          )}
        </div>
      )}
    </>
  )
}

function LockedFeedMessage() {
  return (
    <div className="border-b border-zinc-800 px-4 pb-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Submit to Reveal</p>
        <h2 className="mt-3 text-xl font-bold text-white">Say your word before the crowd gets a vote in your head.</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Today&apos;s answers, reactions, and comparisons unlock right after you post.
        </p>
      </div>
    </div>
  )
}

export default function FeedTabs({ initialData }: { initialData: FeedData }) {
  const [activeFilter, setActiveFilter] = useState<FilterType>(initialData.filter)
  const [cache, setCache] = useState<Record<FilterType, FeedData | undefined>>({
    [initialData.filter]: initialData,
  } as Record<FilterType, FeedData | undefined>)
  const [loadingFilter, setLoadingFilter] = useState<FilterType | null>(null)
  const [isPending, startTransition] = useTransition()

  const user = initialData.user
  const shouldGateToday = !!initialData.todaysPrompt && !initialData.hasPostedToday
  const liveCache = useMemo(
    () => ({ ...cache, [initialData.filter]: initialData }),
    [cache, initialData]
  )
  const visibleFilters = useMemo(
    () => FILTERS.filter((filter) => !filter.authOnly || user),
    [user]
  )

  const loadFilter = useCallback(async (filter: FilterType) => {
    const response = await fetch(`/api/feed?filter=${filter}`, {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`Failed to load ${filter} feed`)
    }

    return response.json() as Promise<FeedData>
  }, [])

  const showFilter = useCallback((filter: FilterType) => {
    startTransition(() => {
      setActiveFilter(filter)
    })

    const url = filter === 'today' ? '/' : `/?filter=${filter}`
    window.history.pushState(null, '', url)

    if (liveCache[filter]) return

    setLoadingFilter(filter)
    loadFilter(filter)
      .then((data) => {
        setCache((current) => ({ ...current, [filter]: data }))
      })
      .catch(() => {
        window.location.href = url
      })
      .finally(() => {
        setLoadingFilter((current) => (current === filter ? null : current))
      })
  }, [liveCache, loadFilter])

  useEffect(() => {
    const filtersToPrefetch = visibleFilters
      .map((filter) => filter.key)
      .filter((filter) => filter !== initialData.filter)

    filtersToPrefetch.forEach((filter) => {
      loadFilter(filter)
        .then((data) => {
          setCache((current) => current[filter] ? current : { ...current, [filter]: data })
        })
        .catch(() => {})
    })
  }, [initialData.filter, loadFilter, visibleFilters])

  const activeData = liveCache[activeFilter]
  const isLoading = !activeData || loadingFilter === activeFilter || isPending

  if (shouldGateToday) {
    return (
      <>
        {user ? (
          <PostWord
            userId={user.id}
            promptId={initialData.todaysPrompt?.id || null}
            promptQuestion={initialData.todaysPrompt?.question || null}
            hasPostedToday={false}
          />
        ) : initialData.todaysPrompt ? (
          <AnonPostWord
            promptId={initialData.todaysPrompt.id}
            promptQuestion={initialData.todaysPrompt.question}
          />
        ) : null}

        <div className="px-4 pb-2 flex justify-end">
          <PromptTimer />
        </div>

        <LockedFeedMessage />
      </>
    )
  }

  return (
    <>
      <div className="flex border-b border-zinc-800">
        {visibleFilters.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => showFilter(key)}
            className={`flex-1 text-center py-3 text-sm font-medium transition-colors ${
              activeFilter === key
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? <FeedSkeleton /> : <FeedContent data={activeData} />}
    </>
  )
}
