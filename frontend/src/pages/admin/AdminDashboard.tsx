import { useCallback, useEffect, useRef, useState } from 'react'
import {
  deleteAdminListing,
  fetchAdminListings,
  fetchAdminUsers,
  updateAdminListing,
  banUser,
  unbanUser,
  fetchUsageStats,
  type AdminListing,
  type AdminListingUpdatePayload,
  type AdminUser,
  type UsageStats,
} from '../../services/admin'
import { fetchListingCategories, type ListingCategory } from '../../services/listings'

type Tab = 'stats' | 'listings' | 'users'

type Toast = {
  id: string
  message: string
  type: 'success' | 'error'
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>('stats')
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastIdCounter = useRef(0)

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = `toast-${toastIdCounter.current++}`
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-primary">Admin Dashboard</h1>
        <p className="text-base text-slate-600">
          Manage listings and users across the marketplace.
        </p>
      </div>

      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'stats'
              ? 'border-b-2 border-primary text-primary'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Stats
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'listings'
              ? 'border-b-2 border-primary text-primary'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Listings
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'users'
              ? 'border-b-2 border-primary text-primary'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Users
        </button>
      </div>

      {activeTab === 'stats' ? (
        <StatsPanel addToast={addToast} />
      ) : activeTab === 'listings' ? (
        <ListingsPanel addToast={addToast} />
      ) : (
        <UsersPanel addToast={addToast} />
      )}

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-white hover:opacity-80"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

type PanelProps = {
  addToast: (message: string, type: 'success' | 'error') => void
}

const StatsPanel = ({ addToast }: PanelProps) => {
  const isMountedRef = useRef(false)
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const loadStats = useCallback(async () => {
    if (!isMountedRef.current) return

    setLoading(true)
    setError(null)

    try {
      const result = await fetchUsageStats()
      if (isMountedRef.current) {
        setStats(result)
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to load statistics'
        setError(message)
        addToast(message, 'error')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [addToast])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return (
    <div className="flex flex-col gap-6">
      {/* Loading state */}
      {loading && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary"></div>
          <p className="mt-2 text-sm text-slate-600">Loading statistics...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
          <button type="button" onClick={loadStats} className="ml-2 font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {/* Stats display */}
      {!loading && !error && stats && (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Listings card */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-2 text-sm font-medium text-slate-600">Total Listings</div>
              <div className="mb-4 text-3xl font-bold text-primary">{stats.listings.total}</div>
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Active:</span>
                  <span className="font-semibold text-green-600">{stats.listings.active}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending:</span>
                  <span className="font-semibold text-yellow-600">{stats.listings.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span>Approved:</span>
                  <span className="font-semibold text-green-600">{stats.listings.approved}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rejected:</span>
                  <span className="font-semibold text-red-600">{stats.listings.rejected}</span>
                </div>
              </div>
            </div>

            {/* Users card */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-2 text-sm font-medium text-slate-600">Total Users</div>
              <div className="mb-4 text-3xl font-bold text-primary">{stats.users.total}</div>
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Active:</span>
                  <span className="font-semibold text-green-600">{stats.users.active}</span>
                </div>
                <div className="flex justify-between">
                  <span>Banned:</span>
                  <span className="font-semibold text-red-600">{stats.users.banned}</span>
                </div>
              </div>
            </div>

            {/* Conversations card */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-2 text-sm font-medium text-slate-600">Conversations</div>
              <div className="mb-4 text-3xl font-bold text-primary">{stats.conversations.total}</div>
              <div className="text-xs text-slate-600">
                Total conversation threads between users
              </div>
            </div>

            {/* Messages card */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-2 text-sm font-medium text-slate-600">Messages</div>
              <div className="mb-4 text-3xl font-bold text-primary">{stats.messages.total}</div>
              <div className="text-xs text-slate-600">
                Total messages exchanged on the platform
              </div>
            </div>
          </div>

          {/* Popular categories */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Popular Categories</h2>
            {stats.popularCategories.length === 0 ? (
              <p className="text-sm text-slate-600">No categories with listings yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.popularCategories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-900">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${Math.min(
                              100,
                              (category.listingCount / stats.popularCategories[0].listingCount) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="w-12 text-right text-sm font-semibold text-slate-600">
                        {category.listingCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

const ListingsPanel = ({ addToast }: PanelProps) => {
  const isMountedRef = useRef(false)
  const [listings, setListings] = useState<AdminListing[]>([])
  const [categories, setCategories] = useState<ListingCategory[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [statusFilter, setStatusFilter] = useState<'' | 'pending' | 'approved' | 'rejected'>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingListing, setEditingListing] = useState<AdminListing | null>(null)
  const [deletingListing, setDeletingListing] = useState<AdminListing | null>(null)
  const [operationInProgress, setOperationInProgress] = useState(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      const result = await fetchListingCategories()
      if (isMountedRef.current) {
        setCategories(result)
      }
    } catch (err) {
      console.error('Failed to load categories', err)
    }
  }, [])

  const loadListings = useCallback(async () => {
    if (!isMountedRef.current) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetchAdminListings({
        status: statusFilter || undefined,
        page,
        limit,
      })
      if (isMountedRef.current) {
        setListings(response.items)
        setTotal(response.total)
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to load listings'
        setError(message)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [statusFilter, page, limit])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    loadListings()
  }, [loadListings])

  const handleStatusChange = (status: '' | 'pending' | 'approved' | 'rejected') => {
    setStatusFilter(status)
    setPage(1)
  }

  const handleUpdateStatus = async (
    listingId: string,
    moderationStatus: 'approved' | 'rejected',
  ) => {
    if (operationInProgress) return

    setOperationInProgress(true)
    try {
      await updateAdminListing(listingId, { moderationStatus })
      await loadListings()
      addToast(`Listing ${moderationStatus} successfully`, 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update listing'
      addToast(message, 'error')
    } finally {
      if (isMountedRef.current) {
        setOperationInProgress(false)
      }
    }
  }

  const handleSaveEdit = async (payload: AdminListingUpdatePayload) => {
    if (!editingListing || operationInProgress) return

    setOperationInProgress(true)
    try {
      await updateAdminListing(editingListing.id, payload)
      await loadListings()
      setEditingListing(null)
      addToast('Listing updated successfully', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update listing'
      addToast(message, 'error')
    } finally {
      if (isMountedRef.current) {
        setOperationInProgress(false)
      }
    }
  }

  const handleDelete = async () => {
    if (!deletingListing || operationInProgress) return

    setOperationInProgress(true)
    try {
      await deleteAdminListing(deletingListing.id)
      await loadListings()
      setDeletingListing(null)
      addToast('Listing deleted successfully', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete listing'
      addToast(message, 'error')
    } finally {
      if (isMountedRef.current) {
        setOperationInProgress(false)
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          Status:
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value as '' | 'pending' | 'approved' | 'rejected')}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </div>

      {/* Loading/Error states */}
      {loading && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary"></div>
          <p className="mt-2 text-sm text-slate-600">Loading listings...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
          <button
            type="button"
            onClick={loadListings}
            className="ml-2 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && listings.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          No listings found
        </div>
      )}

      {!loading && !error && listings.length > 0 && (
        <>
          {/* Listings table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{listing.title}</div>
                      {listing.category && (
                        <div className="text-xs text-slate-500">{listing.category.name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{listing.owner.name}</td>
                    <td className="px-4 py-3 text-slate-700">${listing.price}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          listing.moderationStatus === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : listing.moderationStatus === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {listing.moderationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {listing.moderationStatus === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(listing.id, 'approved')}
                              disabled={operationInProgress}
                              className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(listing.id, 'rejected')}
                              disabled={operationInProgress}
                              className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditingListing(listing)}
                          disabled={operationInProgress}
                          className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingListing(listing)}
                          disabled={operationInProgress}
                          className="rounded bg-slate-600 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div>
              Showing {total > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total}{' '}
              listings
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * limit >= total}
                className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit modal */}
      {editingListing && (
        <EditListingModal
          listing={editingListing}
          categories={categories}
          onSave={handleSaveEdit}
          onClose={() => setEditingListing(null)}
          isSubmitting={operationInProgress}
        />
      )}

      {/* Delete confirmation modal */}
      {deletingListing && (
        <DeleteConfirmationModal
          listing={deletingListing}
          onConfirm={handleDelete}
          onClose={() => setDeletingListing(null)}
          isDeleting={operationInProgress}
        />
      )}
    </div>
  )
}

type EditListingModalProps = {
  listing: AdminListing
  categories: ListingCategory[]
  onSave: (payload: AdminListingUpdatePayload) => void
  onClose: () => void
  isSubmitting: boolean
}

const EditListingModal = ({
  listing,
  categories,
  onSave,
  onClose,
  isSubmitting,
}: EditListingModalProps) => {
  const [title, setTitle] = useState(listing.title)
  const [description, setDescription] = useState(listing.description)
  const [price, setPrice] = useState(listing.price)
  const [categoryId, setCategoryId] = useState(listing.category?.id || '')
  const [isActive, setIsActive] = useState(listing.isActive)
  const [moderationStatus, setModerationStatus] = useState(listing.moderationStatus)
  const [moderationNotes, setModerationNotes] = useState(listing.moderationNotes || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      title,
      description,
      price,
      categoryId: categoryId || undefined,
      isActive,
      moderationStatus,
      moderationNotes: moderationNotes || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-semibold text-slate-900">Edit Listing</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span>Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2"
              rows={4}
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span>Price</span>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span>Category</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4"
            />
            <span>Active listing</span>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span>Moderation Status</span>
            <select
              value={moderationStatus}
              onChange={(e) =>
                setModerationStatus(e.target.value as 'pending' | 'approved' | 'rejected')
              }
              className="rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span>Moderation Notes</span>
            <textarea
              value={moderationNotes}
              onChange={(e) => setModerationNotes(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2"
              rows={3}
              placeholder="Optional notes about this listing's moderation"
            />
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

type DeleteConfirmationModalProps = {
  listing: AdminListing
  onConfirm: () => void
  onClose: () => void
  isDeleting: boolean
}

const DeleteConfirmationModal = ({
  listing,
  onConfirm,
  onClose,
  isDeleting,
}: DeleteConfirmationModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Delete Listing</h2>
        <p className="mb-6 text-sm text-slate-600">
          Are you sure you want to delete "{listing.title}"? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

const UsersPanel = ({ addToast }: PanelProps) => {
  const isMountedRef = useRef(false)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [operationInProgress, setOperationInProgress] = useState(false)
  const [banningUser, setBanningUser] = useState<AdminUser | null>(null)
  const [banReason, setBanReason] = useState('')

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const loadUsers = useCallback(async () => {
    if (!isMountedRef.current) return

    setLoading(true)
    setError(null)

    try {
      const result = await fetchAdminUsers()
      if (isMountedRef.current) {
        setUsers(result)
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to load users'
        setError(message)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleBan = async () => {
    if (!banningUser || operationInProgress) return

    setOperationInProgress(true)
    try {
      await banUser(banningUser.id, { reason: banReason || undefined })
      await loadUsers()
      setBanningUser(null)
      setBanReason('')
      addToast('User banned successfully', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to ban user'
      addToast(message, 'error')
    } finally {
      if (isMountedRef.current) {
        setOperationInProgress(false)
      }
    }
  }

  const handleUnban = async (userId: string) => {
    if (operationInProgress) return

    setOperationInProgress(true)
    try {
      await unbanUser(userId)
      await loadUsers()
      addToast('User unbanned successfully', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unban user'
      addToast(message, 'error')
    } finally {
      if (isMountedRef.current) {
        setOperationInProgress(false)
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Loading/Error states */}
      {loading && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary"></div>
          <p className="mt-2 text-sm text-slate-600">Loading users...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
          <button type="button" onClick={loadUsers} className="ml-2 font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          No users found
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Listings</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                  <td className="px-4 py-3 text-slate-700">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{user.listingsCount}</td>
                  <td className="px-4 py-3">
                    {user.isBanned ? (
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                          Banned
                        </span>
                        {user.banReason && (
                          <span className="text-xs text-slate-500">{user.banReason}</span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.role !== 'admin' && (
                      <>
                        {user.isBanned ? (
                          <button
                            type="button"
                            onClick={() => handleUnban(user.id)}
                            disabled={operationInProgress}
                            className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setBanningUser(user)}
                            disabled={operationInProgress}
                            className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Ban
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ban user modal */}
      {banningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Ban User</h2>
            <p className="mb-4 text-sm text-slate-600">
              Are you sure you want to ban {banningUser.name}? They will not be able to access the
              marketplace.
            </p>
            <label className="mb-4 flex flex-col gap-1 text-sm font-medium text-slate-700">
              <span>Reason (optional)</span>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2"
                rows={3}
                placeholder="Explain why this user is being banned"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setBanningUser(null)
                  setBanReason('')
                }}
                disabled={operationInProgress}
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBan}
                disabled={operationInProgress}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {operationInProgress ? 'Banning...' : 'Ban User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
