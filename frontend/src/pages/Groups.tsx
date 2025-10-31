import { type FC, useState, useEffect } from 'react'
import { groupsService } from '../services/groups'
import type { Group, GroupType } from '../types/group'
import { useAuth } from '../context/useAuth'
import GroupCard from '../components/groups/GroupCard'
import CreateGroupModal from '../components/groups/CreateGroupModal'

const Groups: FC = () => {
  const { token, user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<GroupType | 'all'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewMode, setViewMode] = useState<'all' | 'my'>('all')

  const fetchGroups = async () => {
    try {
      setLoading(true)
      setError(null)
      let data: Group[]
      
      if (viewMode === 'my' && token) {
        data = await groupsService.getMyGroups()
      } else {
        data = await groupsService.getGroups()
      }
      
      setGroups(data)
      setFilteredGroups(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, token])

  useEffect(() => {
    if (filterType === 'all') {
      setFilteredGroups(groups)
    } else {
      setFilteredGroups(groups.filter((g) => g.type === filterType))
    }
  }, [filterType, groups])

  const handleGroupCreated = (newGroup: Group) => {
    setGroups((prev) => [newGroup, ...prev])
    setShowCreateModal(false)
  }

  const handleGroupUpdated = (updatedGroup: Group) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g))
    )
  }

  const handleGroupDeleted = (deletedGroupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== deletedGroupId))
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
