import type { FC } from 'react'
import { useState } from 'react'
import type { GroupSummary } from '../../types/group'
import { toGroupSummary } from '../../types/group'
import { useAuth } from '../../context/useAuth'
import { groupsService } from '../../services/groups'
import EditGroupModal from './EditGroupModal'

type Props = {
  group: GroupSummary
  onGroupUpdated: (group: GroupSummary) => void
  onGroupDeleted: (groupId: string) => void
  onSelect?: (group: Group) => void
  isSelected?: boolean
}

const GroupCard: FC<Props> = ({
  group,
  onGroupUpdated,
  onGroupDeleted,
  onSelect,
  isSelected = false,
}) => {
  const { token, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const isOwner = group.owner ? user?.id === group.owner.id : false
  const isMember = Boolean(group.isMember)
  const memberCount = group.memberCount

  const typeColors = {
    hobby: 'bg-blue-100 text-blue-800',
    interest: 'bg-purple-100 text-purple-800',
    block: 'bg-green-100 text-green-800',
  }

  const handleJoin = async () => {
    if (!token) return
    try {
      setLoading(true)
      const updated = await groupsService.joinGroup(group.id)
      const summary = toGroupSummary(updated, {
        isMember: true,
        membershipRole: 'member',
      })
      onGroupUpdated(summary)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to join group')
    } finally {
      setLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!token) return
    if (
      !confirm('Are you sure you want to leave this group?')
    )
      return

    try {
      setLoading(true)
      const updated = await groupsService.leaveGroup(group.id)
      const summary = toGroupSummary(updated, {
        isMember: false,
        memberCount: Math.max(updated.members.length, 0),
      })
      onGroupUpdated(summary)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to leave group')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!token) return
    if (
      !confirm(
        'Are you sure you want to delete this group? This action cannot be undone.'
      )
    )
      return

    try {
      setLoading(true)
      await groupsService.deleteGroup(group.id)
      onGroupDeleted(group.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete group')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = () => {
    if (onSelect) {
      onSelect(group)
    }
  }

  return (
    <>
      <div
        className={`flex flex-col rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md ${
          isSelected
            ? 'border-primary ring-2 ring-primary/40'
            : 'border-slate-200'
        }`}
      >
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-800">{group.name}</h3>
            <span
              className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-semibold ${typeColors[group.type]}`}
            >
              {group.type}
            </span>
          </div>
        </div>

        {group.description && (
          <p className="mb-4 line-clamp-3 text-sm text-slate-600">
            {group.description}
          </p>
        )}

        <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span>
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Created by {group.owner?.name ?? 'Unknown'}</span>
          {onSelect ? (
            <button
              type="button"
              onClick={handleSelect}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                isSelected
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary'
              }`}
            >
              {isSelected ? 'Viewing' : 'View details'}
            </button>
          ) : null}
        </div>

        {user && (
          <div className="mt-4 flex gap-2">
            {!isMember && (
              <button
                type="button"
                onClick={handleJoin}
                disabled={loading}
                className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join Group'}
              </button>
            )}
            {isMember && !isOwner && (
              <button
                type="button"
                onClick={handleLeave}
                disabled={loading}
                className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {loading ? 'Leaving...' : 'Leave Group'}
              </button>
            )}
            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  disabled={loading}
                  className="flex-1 rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {showEditModal && (
        <EditGroupModal
          group={group}
          onClose={() => setShowEditModal(false)}
          onGroupUpdated={(updated) => {
            onGroupUpdated(updated)
            setShowEditModal(false)
          }}
        />
      )}
    </>
  )
}

export default GroupCard
