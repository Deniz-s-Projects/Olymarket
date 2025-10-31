import { type FC, type FormEvent, useState, useEffect, useMemo, useRef } from 'react'
import { groupsService } from '../services/groups'
import { toGroupSummary } from '../types/group'
import type {
  Group,
  GroupSummary, 
  PaginationMeta,
  GroupType,
  GroupEvent,
  GroupEventRsvpStatus,
  GroupPost,
} from '../types/group'
import { useAuth } from '../context/useAuth'
import GroupCard from '../components/groups/GroupCard'
import CreateGroupModal from '../components/groups/CreateGroupModal'
import { useNotifications } from '../context/useNotifications'

const EVENT_REMINDER_WINDOW_MS = 1000 * 60 * 60 * 24 // 24 hours

const toDateTimeLocal = (date: Date) => {
  const iso = date.toISOString()
  return iso.slice(0, 16)
}

const Groups: FC = () => {
  const { token, user } = useAuth()
  const { addNotification } = useNotifications()
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [filteredGroups, setFilteredGroups] = useState<GroupSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<GroupType | 'all'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewMode, setViewMode] = useState<'all' | 'my'>('all')
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [membershipMap, setMembershipMap] = useState<Record<string, GroupSummary['membershipRole'] | undefined>>({})
  const [events, setEvents] = useState<GroupEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [posts, setPosts] = useState<GroupPost[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postsError, setPostsError] = useState<string | null>(null)
  const [isEventFormOpen, setIsEventFormOpen] = useState(false)
  const [eventFormMode, setEventFormMode] = useState<'create' | 'edit'>('create')
  const [eventFormDraft, setEventFormDraft] = useState({
    title: '',
    description: '',
    startAt: toDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)),
    endAt: '',
    location: '',
    isAllDay: false,
    rsvpDeadline: '',
  })
  const [eventSubmitting, setEventSubmitting] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [postTitle, setPostTitle] = useState('')
  const [postBody, setPostBody] = useState('')
  const [postEventId, setPostEventId] = useState<string | ''>('')
  const [postSubmitting, setPostSubmitting] = useState(false)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  
  const [editingPostBody, setEditingPostBody] = useState('')
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const notifiedEventsRef = useRef<Set<string>>(new Set())

  const membership = useMemo(
    () =>
      selectedGroup && user
        ? selectedGroup.members.find((member) => member.user.id === user.id) ?? null
        : null,
    [selectedGroup, user]
  )

  const isOwner = useMemo(
    () => (selectedGroup && user ? selectedGroup.owner.id === user.id : false),
    [selectedGroup, user]
  )

  const canViewEngagement = Boolean(selectedGroup && user && (isOwner || membership))
  const isMember = Boolean(membership)
  const canModerate = Boolean(
    selectedGroup && user && (isOwner || membership?.role === 'moderator')
  )

  const upcomingEvents = useMemo(() => {
    const now = Date.now()
    return [...events]
      .filter((event) => new Date(event.startAt).getTime() >= now)
      .sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      )
  }, [events])

  const orderedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1
      }
      if (a.isArchived !== b.isArchived) {
        return a.isArchived ? 1 : -1
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [posts])

  const sortEvents = (list: GroupEvent[]) =>
    [...list].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    )

  const maybeNotifyUpcomingEvents = (eventList: GroupEvent[]) => {
    if (!user) return
    const now = Date.now()
    eventList.forEach((event) => {
      if (notifiedEventsRef.current.has(event.id)) return
      const start = new Date(event.startAt).getTime()
      if (Number.isNaN(start)) return
      if (start < now || start - now > EVENT_REMINDER_WINDOW_MS) return
      const rsvp = event.rsvps.find((entry) => entry.user.id === user.id)
      if (!rsvp || (rsvp.status !== 'going' && rsvp.status !== 'maybe')) return

      notifiedEventsRef.current.add(event.id)
      addNotification({
        title: `Upcoming event: ${event.title}`,
        message: `Starts ${new Date(event.startAt).toLocaleString()}`,
        variant: 'info',
        durationMs: 8000,
      })
    })
  }

  const fetchGroups = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {
        page: 1,
        limit: 24,
        type: filterType === 'all' ? undefined : filterType,
      }

      if (viewMode === 'my') {
        if (!token) {
          setGroups([])
          setPagination(null)
          setMembershipMap({})
          return
        }

        const response = await groupsService.getMyGroups(params)
        const data = response.data.map((group) => ({
          ...group,
          isMember: true,
        }))
        const map = data.reduce<Record<string, GroupSummary['membershipRole'] | undefined>>(
          (acc, group) => {
            acc[group.id] = group.membershipRole
            return acc
          },
          {}
        )

        setMembershipMap(map)
        setGroups(data)
        setPagination(response.meta)
        return
      }

      const response = await groupsService.getGroups(params)

      let map: Record<string, GroupSummary['membershipRole'] | undefined> = {}
      if (token) {
        map = {}
        let currentPage = 1
        let hasMore = true
        while (hasMore) {
          const membershipResponse = await groupsService.getMyGroups({ page: currentPage, limit: 100 })
          membershipResponse.data.forEach((group) => {
            map[group.id] = group.membershipRole
          })
          hasMore = membershipResponse.meta.hasMore
          currentPage += 1
        }
        setMembershipMap(map)
      } else {
        setMembershipMap({})
      }

      const data = response.data.map((group) => ({
        ...group,
        isMember: Boolean(map[group.id]),
        membershipRole: map[group.id],
      }))

      setGroups(data)
      setPagination(response.meta)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, token, filterType])

  useEffect(() => {
    notifiedEventsRef.current.clear()
  }, [selectedGroup?.id])

    useEffect(() => {
    let cancelled = false
    const ensureFullSelectedGroup = async () => {
      if (groups.length === 0) {
        setSelectedGroup(null)
        return
      }

      // If we already have a selected group and it's still present in the list,
      // try to load the full group details (members, owner, etc.)
      if (selectedGroup) {
        const found = groups.find((g) => g.id === selectedGroup.id)
        if (found) {
          try {
            const full = await groupsService.getGroup(found.id)
            if (!cancelled) setSelectedGroup(full)
            return
          } catch {
            // fall through and try to load the first group
          }
        }
      }

      try {
        const full = await groupsService.getGroup(groups[0].id)
        if (!cancelled) setSelectedGroup(full)
      } catch {
        if (!cancelled) setSelectedGroup(null)
      }
    }

    void ensureFullSelectedGroup()
    return () => {
      cancelled = true
    }
  }, [groups, selectedGroup])

  useEffect(() => {
    if (filterType === 'all') {
      setFilteredGroups(groups)
    } else {
      setFilteredGroups(groups.filter((g) => g.type === filterType))
    }
  }, [filterType, groups])

  useEffect(() => {
    if (!selectedGroup || !token || !canViewEngagement) {
      setEvents([])
      setPosts([])
      setEventsError(null)
      setPostsError(null)
      return
    }

    let cancelled = false
    const groupId = selectedGroup.id

    const loadEvents = async () => {
      try {
        setEventsLoading(true)
        setEventsError(null)
        const data = await groupsService.getGroupEvents(groupId)
        if (cancelled) return
        setEvents(data)
        maybeNotifyUpcomingEvents(data)
      } catch (err) {
        if (cancelled) return
        setEventsError(
          err instanceof Error ? err.message : 'Failed to load events'
        )
      } finally {
        if (!cancelled) {
          setEventsLoading(false)
        }
      }
    }

    const loadPosts = async () => {
      try {
        setPostsLoading(true)
        setPostsError(null)
        const data = await groupsService.getGroupPosts(groupId)
        if (cancelled) return
        setPosts(data)
      } catch (err) {
        if (cancelled) return
        setPostsError(
          err instanceof Error
            ? err.message
            : 'Failed to load group discussions'
        )
      } finally {
        if (!cancelled) {
          setPostsLoading(false)
        }
      }
    }

    loadEvents()
    loadPosts()

    return () => {
      cancelled = true
    }
  }, [selectedGroup, token, canViewEngagement])

  const handleGroupCreated = (newGroup: Group) => {
    const summary = toGroupSummary(newGroup, {
      isMember: true,
      membershipRole: 'moderator',
    })
    setGroups((prev) => [summary, ...prev])
    setFilteredGroups((prev) => [summary, ...prev])
    setMembershipMap((prev) => ({ ...prev, [summary.id]: summary.membershipRole }))
    setShowCreateModal(false)
    setSelectedGroup(newGroup)
  }

 // ...existing code...
  const handleGroupUpdated = (updatedGroup: GroupSummary) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === updatedGroup.id
          ? {
              ...g,
              ...updatedGroup,
              membershipRole: updatedGroup.isMember
                ? updatedGroup.membershipRole ?? membershipMap[updatedGroup.id] ?? g.membershipRole
                : undefined,
              isMember:
                updatedGroup.isMember ?? (membershipMap[updatedGroup.id] !== undefined || g.isMember),
            }
          : g
      )
    )

    setFilteredGroups((prev) =>
      prev.map((g) =>
        g.id === updatedGroup.id
          ? {
              ...g,
              ...updatedGroup,
              membershipRole: updatedGroup.isMember
                ? updatedGroup.membershipRole ?? membershipMap[updatedGroup.id] ?? g.membershipRole
                : undefined,
              isMember:
                updatedGroup.isMember ?? (membershipMap[updatedGroup.id] !== undefined || g.isMember),
            }
          : g
      )
    )

    if (updatedGroup.isMember) {
      setMembershipMap((prev) => ({
        ...prev,
        [updatedGroup.id]: updatedGroup.membershipRole ?? prev[updatedGroup.id],
      }))
    } else if (updatedGroup.isMember === false) {
      setMembershipMap((prev) => {
        const next = { ...prev }
        delete next[updatedGroup.id]
        return next
      })
    }
  }
// ...existing code...

 // ...existing code...
  const handleGroupDeleted = (deletedGroupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== deletedGroupId))
    setFilteredGroups((prev) => prev.filter((g) => g.id !== deletedGroupId))
    setMembershipMap((prev) => {
      const next = { ...prev }
      delete next[deletedGroupId]
      return next
    })
    setSelectedGroup((current) =>
      current && current.id === deletedGroupId ? null : current
    )
  }
  
  const openCreateEventForm = () => {
    setEventFormDraft({
      title: '',
      description: '',
      startAt: toDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)),
      endAt: '',
      location: '',
      isAllDay: false,
      rsvpDeadline: '',
    })
    setEventFormMode('create')
    setEditingEventId(null)
    setIsEventFormOpen(true)
  }

  const openEditEventForm = (event: GroupEvent) => {
    setEventFormDraft({
      title: event.title,
      description: event.description ?? '',
      startAt: toDateTimeLocal(new Date(event.startAt)),
      endAt: event.endAt ? toDateTimeLocal(new Date(event.endAt)) : '',
      location: event.location ?? '',
      isAllDay: event.isAllDay,
      rsvpDeadline: event.rsvpDeadline
        ? toDateTimeLocal(new Date(event.rsvpDeadline))
        : '',
    })
    setEventFormMode('edit')
    setEditingEventId(event.id)
    setIsEventFormOpen(true)
  }

  const closeEventForm = () => {
    setIsEventFormOpen(false)
    setEditingEventId(null)
    setEventSubmitting(false)
  }

  const handleEventFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedGroup) return

    setEventSubmitting(true)
    const payload = {
      title: eventFormDraft.title.trim(),
      description: eventFormDraft.description.trim()
        ? eventFormDraft.description.trim()
        : null,
      startAt: new Date(eventFormDraft.startAt).toISOString(),
      endAt: eventFormDraft.endAt
        ? new Date(eventFormDraft.endAt).toISOString()
        : null,
      location: eventFormDraft.location.trim()
        ? eventFormDraft.location.trim()
        : null,
      isAllDay: eventFormDraft.isAllDay,
      rsvpDeadline: eventFormDraft.rsvpDeadline
        ? new Date(eventFormDraft.rsvpDeadline).toISOString()
        : null,
    }

    try {
      let savedEvent: GroupEvent
      if (eventFormMode === 'edit' && editingEventId) {
        savedEvent = await groupsService.updateGroupEvent(
          selectedGroup.id,
          editingEventId,
          payload
        )
        addNotification({
          message: 'Event updated successfully.',
          variant: 'success',
          durationMs: 6000,
        })
      } else {
        savedEvent = await groupsService.createGroupEvent(
          selectedGroup.id,
          payload
        )
        addNotification({
          message: 'Event created successfully.',
          variant: 'success',
          durationMs: 6000,
        })
      }

      setEvents((prev) => sortEvents([...prev.filter((e) => e.id !== savedEvent.id), savedEvent]))
      maybeNotifyUpcomingEvents([savedEvent])
      closeEventForm()
    } catch (err) {
      addNotification({
        message:
          err instanceof Error ? err.message : 'Unable to save event at this time.',
        variant: 'danger',
        durationMs: 8000,
      })
    } finally {
      setEventSubmitting(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!selectedGroup) return
    if (
      !confirm(
        'Are you sure you want to delete this event? This action cannot be undone.'
      )
    ) {
      return
    }

    try {
      await groupsService.deleteGroupEvent(selectedGroup.id, eventId)
      setEvents((prev) => prev.filter((event) => event.id !== eventId))
      addNotification({
        message: 'Event deleted.',
        variant: 'warning',
        durationMs: 5000,
      })
    } catch (err) {
      addNotification({
        message:
          err instanceof Error ? err.message : 'Failed to delete the event.',
        variant: 'danger',
        durationMs: 8000,
      })
    }
  }

  const handleRsvp = async (eventId: string, status: GroupEventRsvpStatus) => {
    if (!selectedGroup) return
    try {
      const updated = await groupsService.rsvpToEvent(selectedGroup.id, eventId, {
        status,
      })
      setEvents((prev) =>
        sortEvents([...prev.filter((event) => event.id !== updated.id), updated])
      )
      maybeNotifyUpcomingEvents([updated])
      addNotification({
        message: `RSVP updated to ${status.replace('_', ' ')}.`,
        variant: 'success',
        durationMs: 5000,
      })
    } catch (err) {
      addNotification({
        message:
          err instanceof Error ? err.message : 'Unable to update RSVP right now.',
        variant: 'danger',
        durationMs: 8000,
      })
    }
  }

  const handleCreatePost = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault()
    if (!selectedGroup) return
    if (!postBody.trim()) {
      addNotification({
        message: 'Please enter a message before posting.',
        variant: 'warning',
        durationMs: 5000,
      })
      return
    }

    setPostSubmitting(true)
    try {
      const created = await groupsService.createGroupPost(selectedGroup.id, {
        title: postTitle.trim() || null,
        body: postBody.trim(),
        eventId: postEventId || null,
      })

      if (created) {
        setPosts((prev) => [created, ...prev.filter((post) => post.id !== created.id)])
      } else {
        const refreshed = await groupsService.getGroupPosts(selectedGroup.id)
        setPosts(refreshed)
      }

      setPostTitle('')
      setPostBody('')
      setPostEventId('')
      addNotification({
        message: 'Update shared with the group.',
        variant: 'success',
        durationMs: 5000,
      })
    } catch (err) {
      addNotification({
        message:
          err instanceof Error ? err.message : 'Failed to create the post.',
        variant: 'danger',
        durationMs: 8000,
      })
    } finally {
      setPostSubmitting(false)
    }
  }

  const handleEditPost = (post: GroupPost) => {
    setEditingPostId(post.id)
    setEditingPostBody(post.body)
  }

  const handleCancelPostEdit = () => {
    setEditingPostId(null)
    setEditingPostBody('')
  }

  const handleSavePostEdit = async (postId: string) => {
    if (!selectedGroup) return
    if (!editingPostBody.trim()) {
      addNotification({
        message: 'Post cannot be empty.',
        variant: 'warning',
        durationMs: 5000,
      })
      return
    }

    try {
      const updated = await groupsService.updateGroupPost(
        selectedGroup.id,
        postId,
        {
          body: editingPostBody.trim(),
        }
      )

      if (updated) {
        setPosts((prev) =>
          prev.map((post) => (post.id === updated.id ? updated : post))
        )
      } else {
        const refreshed = await groupsService.getGroupPosts(selectedGroup.id)
        setPosts(refreshed)
      }

      setEditingPostId(null)
      setEditingPostBody('')
      addNotification({
        message: 'Post updated.',
        variant: 'success',
        durationMs: 5000,
      })
    } catch (err) {
      addNotification({
        message:
          err instanceof Error ? err.message : 'Unable to update the post.',
        variant: 'danger',
        durationMs: 8000,
      })
    }
  }

  const updatePostModeration = async (
    postId: string,
    changes: Partial<{ isPinned: boolean; isArchived: boolean }>,
    successMessage: string
  ) => {
    if (!selectedGroup) return
    try {
      const updated = await groupsService.updateGroupPost(
        selectedGroup.id,
        postId,
        changes
      )
      if (updated) {
        setPosts((prev) =>
          prev.map((post) => (post.id === updated.id ? updated : post))
        )
      } else {
        const refreshed = await groupsService.getGroupPosts(selectedGroup.id)
        setPosts(refreshed)
      }
      addNotification({
        message: successMessage,
        variant: 'success',
        durationMs: 5000,
      })
    } catch (err) {
      addNotification({
        message:
          err instanceof Error ? err.message : 'Unable to update post settings.',
        variant: 'danger',
        durationMs: 8000,
      })
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!selectedGroup) return
    if (!confirm('Remove this post from the discussion?')) {
      return
    }

    try {
      await groupsService.deleteGroupPost(selectedGroup.id, postId)
      setPosts((prev) => prev.filter((post) => post.id !== postId))
      addNotification({
        message: 'Post deleted.',
        variant: 'warning',
        durationMs: 5000,
      })
    } catch (err) {
      addNotification({
        message:
          err instanceof Error ? err.message : 'Unable to delete the post.',
        variant: 'danger',
        durationMs: 8000,
      })
    }
  }

  const handleCommentChange = (postId: string, value: string) => {
    setCommentDrafts((prev) => ({ ...prev, [postId]: value }))
  }

  const handleSubmitComment = async (postId: string) => {
    if (!selectedGroup) return
    const draft = commentDrafts[postId]?.trim()
    if (!draft) {
      addNotification({
        message: 'Add a comment before submitting.',
        variant: 'warning',
        durationMs: 4000,
      })
      return
    }

    try {
      const comment = await groupsService.createGroupComment(
        selectedGroup.id,
        postId,
        { body: draft }
      )
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, comments: [...post.comments, comment] }
            : post
        )
      )
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }))
      addNotification({
        message: 'Comment added.',
        variant: 'success',
        durationMs: 4000,
      })
    } catch (err) {
      addNotification({
        message:
          err instanceof Error ? err.message : 'Unable to add your comment.',
        variant: 'danger',
        durationMs: 8000,
      })
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Community Groups</h1>
          <p className="mt-2 text-slate-600">
            Connect with neighbors who share your interests
          </p>
        </div>
        {user && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="rounded-full bg-primary px-6 py-2 font-semibold text-white transition hover:bg-primary/90"
          >
            Create Group
          </button>
        )}
      </div>

      {/* View Toggle */}
      {user && (
        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              viewMode === 'all'
                ? 'bg-primary text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Groups
          </button>
          <button
            type="button"
            onClick={() => setViewMode('my')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              viewMode === 'my'
                ? 'bg-primary text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            My Groups
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            filterType === 'all'
              ? 'bg-primary text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Types
        </button>
        <button
          type="button"
          onClick={() => setFilterType('hobby')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            filterType === 'hobby'
              ? 'bg-primary text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Hobby
        </button>
        <button
          type="button"
          onClick={() => setFilterType('interest')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            filterType === 'interest'
              ? 'bg-primary text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Interest
        </button>
        <button
          type="button"
          onClick={() => setFilterType('block')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            filterType === 'block'
              ? 'bg-primary text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Block
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center text-slate-600">Loading groups...</div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
      )}
 
      {/* Pagination Summary */}
      {!loading && !error && pagination && (
        <div className="mb-4 text-sm text-slate-500">
          Showing {filteredGroups.length} of {pagination.total}{' '}
          {viewMode === 'my' ? 'groups you belong to' : 'groups'}
        </div>
      )} 
  
      {/* Empty State */}
      {!loading && !error && filteredGroups.length === 0 && (
        <div className="text-center">
          <div className="rounded-lg bg-white p-12">
            <p className="text-lg text-slate-600">
              {viewMode === 'my'
                ? "You haven't joined any groups yet"
                : filterType === 'all'
                  ? 'No groups available yet. Be the first to create one!'
                  : `No ${filterType} groups found`}
            </p>
          </div>
        </div>
      )} 

      {/* Groups Grid */}
      {!loading && !error && filteredGroups.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onGroupUpdated={handleGroupUpdated}
              onGroupDeleted={handleGroupDeleted} 
              isSelected={selectedGroup?.id === group.id}
            />
          ))}
        </div>
      )}

      {/* Group Details */}
      {selectedGroup ? (
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-800">
                  {selectedGroup.name}
                </h2>
                <p className="text-sm text-slate-500">
                  {selectedGroup.description || 'No description provided yet.'}
                </p>
              </div>
              {canModerate && (
                <button
                  type="button"
                  onClick={openCreateEventForm}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  Schedule event
                </button>
              )}
            </div>

            {isEventFormOpen && canModerate && (
              <form
                onSubmit={handleEventFormSubmit}
                className="mt-6 grid gap-4 rounded-lg border border-slate-200 p-4 md:grid-cols-2"
              >
                <div className="md:col-span-2">
                  <label className="flex flex-col text-xs font-semibold text-slate-600">
                    Title
                    <input
                      required
                      value={eventFormDraft.title}
                      onChange={(e) =>
                        setEventFormDraft((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Neighborhood meetup"
                    />
                  </label>
                </div>
                <label className="flex flex-col text-xs font-semibold text-slate-600">
                  Starts
                  <input
                    type="datetime-local"
                    required
                    value={eventFormDraft.startAt}
                    onChange={(e) =>
                      setEventFormDraft((prev) => ({
                        ...prev,
                        startAt: e.target.value,
                      }))
                    }
                    className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="flex flex-col text-xs font-semibold text-slate-600">
                  Ends (optional)
                  <input
                    type="datetime-local"
                    value={eventFormDraft.endAt}
                    onChange={(e) =>
                      setEventFormDraft((prev) => ({
                        ...prev,
                        endAt: e.target.value,
                      }))
                    }
                    className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="flex flex-col text-xs font-semibold text-slate-600">
                  RSVP deadline (optional)
                  <input
                    type="datetime-local"
                    value={eventFormDraft.rsvpDeadline}
                    onChange={(e) =>
                      setEventFormDraft((prev) => ({
                        ...prev,
                        rsvpDeadline: e.target.value,
                      }))
                    }
                    className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="md:col-span-2 flex flex-col text-xs font-semibold text-slate-600">
                  Description (optional)
                  <textarea
                    value={eventFormDraft.description}
                    onChange={(e) =>
                      setEventFormDraft((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Share what to expect or what to bring."
                  />
                </label>
                <label className="flex flex-col text-xs font-semibold text-slate-600">
                  Location (optional)
                  <input
                    value={eventFormDraft.location}
                    onChange={(e) =>
                      setEventFormDraft((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Community center, online, etc."
                  />
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={eventFormDraft.isAllDay}
                    onChange={(e) =>
                      setEventFormDraft((prev) => ({
                        ...prev,
                        isAllDay: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  All-day event
                </label>
                <div className="md:col-span-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeEventForm}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={eventSubmitting}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
                  >
                    {eventSubmitting
                      ? 'Saving...'
                      : eventFormMode === 'edit'
                        ? 'Update Event'
                        : 'Create Event'}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-700">
                Upcoming events
              </h3>
              {!token ? (
                <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                  Sign in to see upcoming events and RSVP.
                </p>
              ) : !canViewEngagement ? (
                <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                  Join this group to view event details and RSVP.
                </p>
              ) : (
                <>
                  {eventsLoading && (
                    <p className="mt-4 text-sm text-slate-500">Loading events...</p>
                  )}
                  {eventsError && (
                    <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                      {eventsError}
                    </p>
                  )}
                  {!eventsLoading && !eventsError && upcomingEvents.length === 0 && (
                    <p className="mt-4 text-sm text-slate-500">
                      No upcoming events yet. Start one to get neighbors together!
                    </p>
                  )}
                  {!eventsLoading && !eventsError && upcomingEvents.length > 0 && (
                    <ul className="mt-4 space-y-4">
                      {upcomingEvents.map((event) => {
                        const start = new Date(event.startAt)
                        const end = event.endAt ? new Date(event.endAt) : null
                        const rsvp = user
                          ? event.rsvps.find((entry) => entry.user.id === user.id)
                          : undefined
                        return (
                          <li
                            key={event.id}
                            className="rounded-lg border border-slate-200 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-lg font-semibold text-slate-800">
                                  {event.title}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {start.toLocaleString()}
                                  {end ? ` – ${end.toLocaleString()}` : ''}
                                </p>
                                {event.location ? (
                                  <p className="text-sm text-slate-500">
                                    Location: {event.location}
                                  </p>
                                ) : null}
                              </div>
                              {canModerate && (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openEditEventForm(event)}
                                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteEvent(event.id)}
                                    className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                            {event.description ? (
                              <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">
                                {event.description}
                              </p>
                            ) : null}
                            {(isMember || isOwner) && (
                              <div className="mt-4 flex flex-wrap items-center gap-2">
                                {(['going', 'maybe', 'not_going'] as GroupEventRsvpStatus[]).map(
                                  (status) => (
                                    <button
                                      key={status}
                                      type="button"
                                      onClick={() => handleRsvp(event.id, status)}
                                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                        rsvp?.status === status
                                          ? 'bg-primary text-white'
                                          : 'bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary'
                                      }`}
                                    >
                                      {status === 'not_going'
                                        ? 'Not going'
                                        : status === 'maybe'
                                          ? 'Maybe'
                                          : 'Going'}
                                    </button>
                                  )
                                )}
                                {rsvp ? (
                                  <span className="text-xs uppercase tracking-wide text-slate-500">
                                    Your response: {rsvp.status.replace('_', ' ')}
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </>
              )}
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-800">
                  Group discussions
                </h3>
                <p className="text-sm text-slate-500">
                  Share updates, organize resources, and keep the conversation going.
                </p>
              </div>
            </div>

            {!token ? (
              <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                Sign in to join the discussion.
              </p>
            ) : !canViewEngagement ? (
              <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                Become a member to participate in discussions.
              </p>
            ) : (
              <>
                <form
                  onSubmit={handleCreatePost}
                  className="mt-6 rounded-lg border border-slate-200 p-4"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex flex-col text-xs font-semibold text-slate-600">
                      Title (optional)
                      <input
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                        className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Community update"
                      />
                    </label>
                    <label className="flex flex-col text-xs font-semibold text-slate-600">
                      Link to event (optional)
                      <select
                        value={postEventId}
                        onChange={(e) => setPostEventId(e.target.value)}
                        className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">No linked event</option>
                        {events.map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="mt-3 flex flex-col text-xs font-semibold text-slate-600">
                    Message
                    <textarea
                      required
                      value={postBody}
                      onChange={(e) => setPostBody(e.target.value)}
                      rows={4}
                      className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Share plans, ask questions, or celebrate wins."
                    />
                  </label>
                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      type="submit"
                      disabled={postSubmitting}
                      className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-60"
                    >
                      {postSubmitting ? 'Posting...' : 'Post update'}
                    </button>
                  </div>
                </form>

                {postsLoading && (
                  <p className="mt-4 text-sm text-slate-500">Loading discussions...</p>
                )}
                {postsError && (
                  <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {postsError}
                  </p>
                )}
                {!postsLoading && !postsError && orderedPosts.length === 0 && (
                  <p className="mt-4 text-sm text-slate-500">
                    No discussions yet. Be the first to share an update!
                  </p>
                )}
                {!postsLoading && !postsError && orderedPosts.length > 0 && (
                  <ul className="mt-6 space-y-5">
                    {orderedPosts.map((post) => {
                      const isAuthor = user?.id === post.author.id
                      return (
                        <li
                          key={post.id}
                          className={`rounded-lg border border-slate-200 p-4 ${
                            post.isArchived ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                {post.title ? (
                                  <p className="text-lg font-semibold text-slate-800">
                                    {post.title}
                                  </p>
                                ) : null}
                                {post.isPinned && (
                                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                                    Pinned
                                  </span>
                                )}
                                {post.isArchived && (
                                  <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Archived
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500">
                                Posted by {post.author.name}
                              </p>
                              {post.event ? (
                                <p className="text-xs text-slate-500">
                                  Linked event: {post.event.title}
                                </p>
                              ) : null}
                            </div>
                            {(canModerate || isAuthor) && (
                              <div className="flex flex-wrap items-center gap-2">
                                {editingPostId === post.id ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleSavePostEdit(post.id)}
                                      className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white transition hover:bg-primary/90"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelPostEdit}
                                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleEditPost(post)}
                                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                    >
                                      Edit
                                    </button>
                                    {canModerate && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            updatePostModeration(
                                              post.id,
                                              { isPinned: !post.isPinned },
                                              post.isPinned
                                                ? 'Post unpinned.'
                                                : 'Post pinned to the top.'
                                            )
                                          }
                                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                        >
                                          {post.isPinned ? 'Unpin' : 'Pin'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            updatePostModeration(
                                              post.id,
                                              { isArchived: !post.isArchived },
                                              post.isArchived
                                                ? 'Post restored.'
                                                : 'Post archived for later.'
                                            )
                                          }
                                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                        >
                                          {post.isArchived ? 'Restore' : 'Archive'}
                                        </button>
                                      </>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePost(post.id)}
                                      className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          {editingPostId === post.id ? (
                            <textarea
                              value={editingPostBody}
                              onChange={(e) => setEditingPostBody(e.target.value)}
                              rows={4}
                              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          ) : (
                            <p className="mt-3 whitespace-pre-line text-sm text-slate-700">
                              {post.body}
                            </p>
                          )}
                          {post.comments.length > 0 && (
                            <div className="mt-4 space-y-3 border-t border-slate-100 pt-3">
                              {post.comments.map((comment) => (
                                <div key={comment.id} className="text-sm">
                                  <span className="font-semibold text-slate-700">
                                    {comment.author.name}
                                  </span>{' '}
                                  <span className="text-slate-500">said:</span>
                                  <p className="text-slate-600 whitespace-pre-line">
                                    {comment.body}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                          {!post.isArchived && (
                            <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3">
                              <textarea
                                value={commentDrafts[post.id] ?? ''}
                                onChange={(e) =>
                                  handleCommentChange(post.id, e.target.value)
                                }
                                rows={2}
                                placeholder="Add a comment"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleSubmitComment(post.id)}
                                  className="rounded-full bg-primary px-4 py-1 text-sm font-semibold text-white transition hover:bg-primary/90"
                                >
                                  Comment
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </>
            )}
          </section>
        </div>
      ) : (
        !loading && !error && (
          <p className="mt-12 text-center text-sm text-slate-500">
            Select a group to explore events and discussions.
          </p>
        )
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}
    </div>
  )
}

export default Groups
