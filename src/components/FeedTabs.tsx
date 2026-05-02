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

export default function FeedTabs({ initialData }: { initialData: FeedData }) {
  const [activeFilter, setActiveFilter] = useState<FilterType>(initialData.filter)
  const [cache, setCache] = useState<Record<FilterType, FeedData | undefined>>({
    [initialData.filter]: initialData,
  } as Record<FilterType, FeedData | undefined>)
  const [loadingFilter, setLoadingFilter] = useState<FilterType | null>(null)
  const [isPending, startTransition] = useTransition()

  const user = initialData.user
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

    if (cache[filter]) return

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
  }, [cache, loadFilter])

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

  const activeData = cache[activeFilter]
  const isLoading = !activeData || loadingFilter === activeFilter || isPending

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
