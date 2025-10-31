import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { communityDiscussionsService } from '../services/communityDiscussions'
import type {
  CommunityDiscussion,
  PaginationMeta,
} from '../types/community'
import { useNotifications } from '../context/useNotifications'
import { useAuth } from '../context/useAuth'

const PAGE_SIZE = 10

const CommunityDiscussions = () => {
  const { addNotification } = useNotifications()
  const { token, isHydrated, user } = useAuth()
  const [discussions, setDiscussions] = useState<CommunityDiscussion[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadFlag, setReloadFlag] = useState(0)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [creatingDiscussion, setCreatingDiscussion] = useState(false)
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [commentSubmitting, setCommentSubmitting] = useState<Record<string, boolean>>({})

  const isCreateDisabled = useMemo(() => {
    return creatingDiscussion || !newTitle.trim() || !newBody.trim()
  }, [creatingDiscussion, newTitle, newBody])

  useEffect(() => {
    if (!isHydrated || !token) {
      return
    }

    let ignore = false

    const fetchDiscussions = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await communityDiscussionsService.getDiscussions({
          page,
          limit: PAGE_SIZE,
        })
        if (ignore) return
        setDiscussions(response.data)
        setPagination(response.meta)
      } catch (err) {
        if (ignore) return
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load community discussions'
        setError(message)
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchDiscussions().catch((err) => {
      console.error('Failed to fetch community discussions', err)
    })

    return () => {
      ignore = true
    }
  }, [isHydrated, token, page, reloadFlag])

  const handleRetry = () => {
    setReloadFlag((prev) => prev + 1)
  }

  const handleCreateDiscussion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!newTitle.trim() || !newBody.trim()) {
      addNotification({
        title: 'Missing details',
        message: 'Please provide both a title and body for your discussion.',
        variant: 'warning',
        durationMs: 4000,
      })
      return
    }

    try {
      setCreatingDiscussion(true)
      await communityDiscussionsService.createDiscussion({
        title: newTitle.trim(),
        body: newBody.trim(),
      })

      addNotification({
        title: 'Discussion posted',
        message: 'Your community discussion is now live.',
        variant: 'success',
        durationMs: 4000,
      })

      setNewTitle('')
      setNewBody('')

      if (page !== 1) {
        setPage(1)
      } else {
        setReloadFlag((prev) => prev + 1)
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to create community discussion'
      addNotification({
        title: 'Posting failed',
        message,
        variant: 'danger',
        durationMs: 5000,
      })
    } finally {
      setCreatingDiscussion(false)
    }
  }

  const handleCommentSubmit = async (
    discussionId: string,
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    const draft = (commentDrafts[discussionId] ?? '').trim()

    if (!draft) {
      addNotification({
        title: 'Add a comment',
        message: 'Please enter a comment before submitting.',
        variant: 'warning',
        durationMs: 3500,
      })
      return
    }

    try {
      setCommentSubmitting((prev) => ({ ...prev, [discussionId]: true }))
      const comment = await communityDiscussionsService.createComment(
        discussionId,
        { body: draft }
      )

      setDiscussions((prev) =>
        prev.map((discussion) =>
          discussion.id === discussionId
            ? {
                ...discussion,
                comments: [...discussion.comments, comment],
              }
            : discussion
        )
      )

      setCommentDrafts((prev) => ({ ...prev, [discussionId]: '' }))

      addNotification({
        title: 'Comment added',
        message: 'Your comment has been posted.',
        variant: 'success',
        durationMs: 3500,
      })
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to post comment right now'
      addNotification({
        title: 'Comment failed',
        message,
        variant: 'danger',
        durationMs: 5000,
      })
    } finally {
      setCommentSubmitting((prev) => {
        const next = { ...prev }
        delete next[discussionId]
        return next
      })
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          Loading community discussions...
        </div>
      )
    }

    if (error) {
      return (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-8 text-center text-rose-700 shadow-sm dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
          <p className="mb-4 font-semibold">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 dark:focus:ring-offset-rose-950"
          >
            Try again
          </button>
        </div>
      )
    }

    if (!discussions.length) {
      return (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <p className="font-medium">No community discussions yet.</p>
          <p className="mt-1 text-sm">
            Be the first to start a conversation and welcome others to share their thoughts.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {discussions.map((discussion) => {
          const commentDraft = commentDrafts[discussion.id] ?? ''
          const isSubmitting = Boolean(commentSubmitting[discussion.id])
          const isSubmitDisabled =
            isSubmitting || commentDraft.trim().length === 0

          return (
            <article
              key={discussion.id}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
            >
              <header className="mb-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {discussion.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Posted by {discussion.author.name || discussion.author.email}{' '}
                  on {new Date(discussion.createdAt).toLocaleString()}
                </p>
              </header>

              <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-200">
                {discussion.body}
              </p>

              <section className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-700">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Comments ({discussion.comments.length})
                </h3>
                {discussion.comments.length > 0 ? (
                  <ul className="space-y-3">
                    {discussion.comments.map((comment) => (
                      <li
                        key={comment.id}
                        className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                      >
                        <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            {comment.author.name || comment.author.email}
                          </span>
                          <span>{new Date(comment.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-200">
                          {comment.body}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No comments yet. Start the conversation!
                  </p>
                )}

                <form
                  className="mt-4 space-y-3"
                  onSubmit={(event) => handleCommentSubmit(discussion.id, event)}
                >
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Add a comment
                    <textarea
                      value={commentDraft}
                      onChange={(event) =>
                        setCommentDrafts((prev) => ({
                          ...prev,
                          [discussion.id]: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-md border border-slate-300 bg-white p-3 text-sm text-slate-800 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-primary"
                      rows={3}
                      placeholder="Share your thoughts..."
                      disabled={isSubmitting}
                    />
                  </label>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitDisabled}
                      className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-400 dark:disabled:bg-slate-600"
                    >
                      {isSubmitting ? 'Posting…' : 'Post comment'}
                    </button>
                  </div>
                </form>
              </section>
            </article>
          )
        })}

        {pagination ? (
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <span>
              Page {pagination.page} of {Math.max(pagination.pageCount, 1)}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={pagination.page <= 1}
                className="rounded-full border border-slate-300 px-3 py-1 font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((prev) =>
                    pagination.hasMore ? prev + 1 : prev
                  )
                }
                disabled={!pagination.hasMore}
                className="rounded-full border border-slate-300 px-3 py-1 font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Community discussions
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Share updates, ask questions, and connect with neighbours across the entire marketplace.
          </p>
        </header>

        <form className="space-y-4" onSubmit={handleCreateDiscussion}>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              Title
              <input
                type="text"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="What would you like to talk about?"
                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                disabled={creatingDiscussion}
                maxLength={150}
                required
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              Body
              <textarea
                value={newBody}
                onChange={(event) => setNewBody(event.target.value)}
                placeholder="Share the details with the community..."
                className="mt-2 w-full rounded-md border border-slate-300 bg-white p-3 text-sm text-slate-800 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                rows={5}
                disabled={creatingDiscussion}
                required
              />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Posting as {user?.name || user?.email}
            </p>
            <button
              type="submit"
              disabled={isCreateDisabled}
              className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-400 dark:disabled:bg-slate-600"
            >
              {creatingDiscussion ? 'Posting…' : 'Post discussion'}
            </button>
          </div>
        </form>
      </section>

      {renderContent()}
    </div>
  )
}

export default CommunityDiscussions
