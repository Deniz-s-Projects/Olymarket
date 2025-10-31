import { type FC, useState, useEffect } from 'react'
import { groupsService } from '../services/groups'
import type { Group, GroupSummary, GroupType, PaginationMeta } from '../types/group'
import { toGroupSummary } from '../types/group'
import { useAuth } from '../context/useAuth'
import GroupCard from '../components/groups/GroupCard'
import CreateGroupModal from '../components/groups/CreateGroupModal'

const Groups: FC = () => {
  const { token, user } = useAuth()
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<GroupType | 'all'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewMode, setViewMode] = useState<'all' | 'my'>('all')
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [membershipMap, setMembershipMap] = useState<Record<string, GroupSummary['membershipRole'] | undefined>>({})

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

  const handleGroupCreated = (newGroup: Group) => {
    const summary = toGroupSummary(newGroup, {
      isMember: true,
      membershipRole: 'moderator',
    })
    setGroups((prev) => [summary, ...prev])
    setMembershipMap((prev) => ({ ...prev, [summary.id]: summary.membershipRole }))
    setShowCreateModal(false)
  }

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

  const handleGroupDeleted = (deletedGroupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== deletedGroupId))
    setMembershipMap((prev) => {
      const next = { ...prev }
      delete next[deletedGroupId]
      return next
    })
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
          Showing {groups.length} of {pagination.total}{' '}
          {viewMode === 'my' ? 'groups you belong to' : 'groups'}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && groups.length === 0 && (
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
      {!loading && !error && groups.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onGroupUpdated={handleGroupUpdated}
              onGroupDeleted={handleGroupDeleted}
            />
          ))}
        </div>
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
