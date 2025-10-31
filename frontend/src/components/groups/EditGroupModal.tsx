import type { FC, FormEvent } from 'react'
import { useState } from 'react'
import type { Group, GroupType } from '../../types/group'
import { useAuth } from '../../context/useAuth'
import { groupsService } from '../../services/groups'

type Props = {
  group: Group
  onClose: () => void
  onGroupUpdated: (group: Group) => void
}

const EditGroupModal: FC<Props> = ({ group, onClose, onGroupUpdated }) => {
  const { token } = useAuth()
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description || '')
  const [type, setType] = useState<GroupType>(group.type)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) return

    if (name.trim().length < 3) {
      setError('Group name must be at least 3 characters')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const updated = await groupsService.updateGroup(
        group.id,
        { name: name.trim(), description: description.trim() || undefined, type },
        token
      )
      onGroupUpdated(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-slate-800">Edit Group</h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-semibold text-slate-700"
            >
              Group Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g., Book Club, Gardening Enthusiasts"
              required
              maxLength={150}
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-semibold text-slate-700"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Tell members what this group is about..."
              rows={4}
            />
          </div>

          <div className="mb-6">
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Group Type *
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="hobby"
                  checked={type === 'hobby'}
                  onChange={(e) => setType(e.target.value as GroupType)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm">
                  <strong>Hobby</strong> - For shared activities and pastimes
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="interest"
                  checked={type === 'interest'}
                  onChange={(e) => setType(e.target.value as GroupType)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm">
                  <strong>Interest</strong> - For topics and subjects you care about
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="block"
                  checked={type === 'block'}
                  onChange={(e) => setType(e.target.value as GroupType)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm">
                  <strong>Block</strong> - For neighbors in a specific area
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-full border border-slate-300 px-6 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || name.trim().length < 3}
              className="rounded-full bg-primary px-6 py-2 font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditGroupModal
