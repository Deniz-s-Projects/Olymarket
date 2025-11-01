import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import {
  deleteAdminListing,
  fetchAdminListings,
  fetchAdminUsers,
  updateAdminListing,
  banUser,
  unbanUser,
  fetchUsageStats,
  createAdminUser,
  updateAdminUser,
  type AdminListing,
  type AdminListingUpdatePayload,
  type AdminUser,
  type UsageStats,
} from '../../services/admin'
import { fetchListingCategories, type ListingCategory } from '../../services/listings'
 
type Tab = 'stats' | 'listings' | 'users' | 'reports' 

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
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'reports'
              ? 'border-b-2 border-primary text-primary'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Reports
        </button>
      </div>

      {activeTab === 'stats' ? (
        <StatsPanel addToast={addToast} />
      ) : activeTab === 'listings' ? (
        <ListingsPanel addToast={addToast} />
      ) : activeTab === 'users' ? (
        <UsersPanel addToast={addToast} />
      ) : (
        <ReportsPanel addToast={addToast} />
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

type UserFormState = {
  name: string
  email: string
  phoneNumber: string
  role: 'user' | 'admin'
  location: string
  bio: string
  password: string
}

const createInitialUserForm = (): UserFormState => ({
  name: '',
  email: '',
  phoneNumber: '',
  role: 'user',
  location: '',
  bio: '',
  password: '',
})

const StatsPanel = ({ addToast }: PanelProps) => {
  const isMountedRef = useRef(false)
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null)

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
        setLastRefreshedAt(new Date())
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
          <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Statistics Overview</h2>
            <div className="flex flex-col items-start gap-2 text-xs text-slate-600 md:flex-row md:items-center md:gap-4">
              {lastRefreshedAt && (
                <span>
                  Last refreshed: {lastRefreshedAt.toLocaleString()}
                </span>
              )}
              <button
                type="button"
                onClick={loadStats}
                disabled={loading}
                className={`rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  loading
                    ? 'cursor-not-allowed bg-slate-400'
                    : 'bg-primary hover:bg-primary/90 focus-visible:outline-primary'
                }`}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

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
                              (category.listingCount / (stats.popularCategories[0]?.listingCount || 1)) * 100,
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
  const [categoryId, setCategoryId] = useState(
    listing.category?.id || categories[0]?.id || '',
  )
  const [status, setStatus] = useState(listing.status)
  const [moderationStatus, setModerationStatus] = useState(listing.moderationStatus)
  const [moderationNotes, setModerationNotes] = useState(listing.moderationNotes || '')

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id)
    }
  }, [categoryId, categories])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryId) {
      return
    }
    onSave({
      title,
      description,
      price,
      categoryId,
      isActive: status === 'active',
      status,
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
            <span>
              Category<span className="ml-1 text-red-500">*</span>
            </span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2"
              required
              disabled={categories.length === 0}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span>Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AdminListing['status'])}
              className="rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="sold">Sold</option>
            </select>
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
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [createUserError, setCreateUserError] = useState<string | null>(null)
  const [newUserForm, setNewUserForm] = useState<UserFormState>(() => createInitialUserForm())
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editUserForm, setEditUserForm] = useState<UserFormState>(() => createInitialUserForm())
  const [editUserError, setEditUserError] = useState<string | null>(null)
  const [updatingUser, setUpdatingUser] = useState(false)

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

  const openCreateModal = () => {
    setNewUserForm(createInitialUserForm())
    setCreateUserError(null)
    setShowCreateUserModal(true)
  }

  const closeCreateModal = () => {
    setShowCreateUserModal(false)
    setNewUserForm(createInitialUserForm())
    setCreateUserError(null)
  }

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (creatingUser) return

    const name = newUserForm.name.trim()
    const email = newUserForm.email.trim()
    const phone = newUserForm.phoneNumber.trim()
    const password = newUserForm.password.trim()
    const location = newUserForm.location.trim()
    const bio = newUserForm.bio.trim()

    if (!name || !email || !phone || !password) {
      setCreateUserError('Name, email, phone number, and password are required.')
      return
    }

    setCreatingUser(true)
    setCreateUserError(null)

    try {
      await createAdminUser({
        name,
        email,
        phoneNumber: phone,
        password,
        role: newUserForm.role,
        location: location || undefined,
        bio: bio || undefined,
      })
      if (isMountedRef.current) {
        await loadUsers()
        addToast('User created successfully', 'success')
        closeCreateModal()
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to create user'
        setCreateUserError(message)
      }
    } finally {
      if (isMountedRef.current) {
        setCreatingUser(false)
      }
    }
  }

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user)
    setEditUserForm({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      location: user.location ?? '',
      bio: user.bio ?? '',
      password: '',
    })
    setEditUserError(null)
  }

  const closeEditModal = () => {
    setEditingUser(null)
    setEditUserForm(createInitialUserForm())
    setEditUserError(null)
  }

  const handleEditUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingUser || updatingUser) return

    const name = editUserForm.name.trim()
    const email = editUserForm.email.trim()
    const phone = editUserForm.phoneNumber.trim()
    const password = editUserForm.password.trim()
    const location = editUserForm.location.trim()
    const bio = editUserForm.bio.trim()

    if (!name || !email || !phone) {
      setEditUserError('Name, email, and phone number are required.')
      return
    }

    setUpdatingUser(true)
    setEditUserError(null)

    try {
      await updateAdminUser(editingUser.id, {
        name,
        email,
        phoneNumber: phone,
        role: editUserForm.role,
        location,
        bio,
        ...(password ? { password } : {}),
      })
      if (isMountedRef.current) {
        await loadUsers()
        addToast('User updated successfully', 'success')
        closeEditModal()
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to update user'
        setEditUserError(message)
      }
    } finally {
      if (isMountedRef.current) {
        setUpdatingUser(false)
      }
    }
  }

  const handleBan = async () => {
    if (!banningUser || operationInProgress) return

    setOperationInProgress(true)
    try {
      await banUser(banningUser.id, { reason: banReason || undefined })
      if (isMountedRef.current) {
        await loadUsers()
        setBanningUser(null)
        setBanReason('')
        addToast('User banned successfully', 'success')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to ban user'
      if (isMountedRef.current) {
        addToast(message, 'error')
      }
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
      if (isMountedRef.current) {
        await loadUsers()
        addToast('User unbanned successfully', 'success')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unban user'
      if (isMountedRef.current) {
        addToast(message, 'error')
      }
    } finally {
      if (isMountedRef.current) {
        setOperationInProgress(false)
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
        >
          Add User
        </button>
      </div>

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
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email &amp; Bio</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Listings</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id} className="align-top hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.phoneNumber}</div>
                    {user.location && <div className="text-xs text-slate-500">{user.location}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <div>{user.email}</div>
                    {user.bio && <div className="mt-1 text-xs text-slate-500">{user.bio}</div>}
                  </td>
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
                        <span className="inline-flex w-fit rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                          Banned
                        </span>
                        {user.banReason && (
                          <span className="text-xs text-slate-500">{user.banReason}</span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex w-fit rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(user)}
                        className="rounded bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-300"
                      >
                        Edit
                      </button>
                      {user.role !== 'admin' && (
                        user.isBanned ? (
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
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create user modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Create User</h2>
            <p className="mb-4 text-sm text-slate-600">
              Set up a new marketplace member. The user will receive the credentials you configure here.
            </p>
            {createUserError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {createUserError}
              </div>
            )}
            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  <span>Name</span>
                  <input
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="rounded-md border border-slate-300 px-3 py-2"
                    placeholder="Jane Doe"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  <span>Email</span>
                  <input
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="rounded-md border border-slate-300 px-3 py-2"
                    placeholder="jane@example.com"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  <span>Phone Number</span>
                  <input
                    value={newUserForm.phoneNumber}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                    className="rounded-md border border-slate-300 px-3 py-2"
                    placeholder="+11234567890"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  <span>Password</span>
                  <input
                    type="password"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="rounded-md border border-slate-300 px-3 py-2"
                    placeholder="Temporary password"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  <span>Role</span>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, role: e.target.value as UserFormState['role'] }))}
                    className="rounded-md border border-slate-300 px-3 py-2"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  <span>Location</span>
                  <input
                    value={newUserForm.location}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, location: e.target.value }))}
                    className="rounded-md border border-slate-300 px-3 py-2"
                    placeholder="City, State"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                <span>Bio</span>
                <textarea
                  value={newUserForm.bio}
                  onChange={(e) => setNewUserForm((prev) => ({ ...prev, bio: e.target.value }))}
                  className="rounded-md border border-slate-300 px-3 py-2"
                  rows={3}
                  placeholder="Share a short introduction for this user"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={creatingUser}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {creatingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit user modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Edit User</h2>
            <p className="mb-4 text-sm text-slate-600">
              Update account details or reset the password for {editingUser.name}.
            </p>
            {editUserError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {editUserError}
              </div>
            )}
            <form onSubmit={handleEditUser} className="flex flex-col gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  <span>Name</span>
                  <input
                    value={editUserForm.name}
                    onChange={(e) => setEditUserForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="rounded-md border border-slate-300 px-3 py-2"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  <span>Email</span>
                  <input
                    type="email"
                    value={editUserForm.email}
                    onChange={(e) => setEditUserForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="rounded-md border border-slate-300 px-3 py-2"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  <span>Phone Number</span>
                  <input
                    value={editUserForm.phoneNumber}
                    onChange={(e) => setEditUserForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                    className="rounded-md border border-slate-300 px-3 py-2"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  <span>Role</span>
                  <select
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm((prev) => ({ ...prev, role: e.target.value as UserFormState['role'] }))}
                    className="rounded-md border border-slate-300 px-3 py-2"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  <span>Location</span>
                  <input
                    value={editUserForm.location}
                    onChange={(e) => setEditUserForm((prev) => ({ ...prev, location: e.target.value }))}
                    className="rounded-md border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  <span>New Password (optional)</span>
                  <input
                    type="password"
                    value={editUserForm.password}
                    onChange={(e) => setEditUserForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="rounded-md border border-slate-300 px-3 py-2"
                    placeholder="Leave blank to keep existing password"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                <span>Bio</span>
                <textarea
                  value={editUserForm.bio}
                  onChange={(e) => setEditUserForm((prev) => ({ ...prev, bio: e.target.value }))}
                  className="rounded-md border border-slate-300 px-3 py-2"
                  rows={3}
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={updatingUser}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingUser}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {updatingUser ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ban user modal */}
      {banningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Ban User</h2>
            <p className="mb-4 text-sm text-slate-600">
              Are you sure you want to ban {banningUser.name}? They will not be able to access the marketplace.
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

const ReportsPanel = ({ addToast }: PanelProps) => {
  const isMountedRef = useRef(false)
  const [reports, setReports] = useState<import('../../services/reports').Report[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [statusFilter, setStatusFilter] = useState<'' | 'pending' | 'under_review' | 'resolved' | 'dismissed'>('')
  const [typeFilter, setTypeFilter] = useState<'' | 'listing' | 'user'>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewingReport, setViewingReport] = useState<import('../../services/reports').Report | null>(null)
  const [operationInProgress, setOperationInProgress] = useState(false)
  const [showResolutionForm, setShowResolutionForm] = useState<'resolved' | 'dismissed' | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [reportPendingDeletion, setReportPendingDeletion] = useState<
    import('../../services/reports').Report | null
  >(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const loadReports = useCallback(async () => {
    if (!isMountedRef.current) return

    setLoading(true)
    setError(null)

    try {
      const { fetchAdminReports } = await import('../../services/admin')
      const response = await fetchAdminReports({
        status: statusFilter || undefined,
        reportType: typeFilter || undefined,
        page,
        limit,
      })
      if (isMountedRef.current) {
        setReports(response.items)
        setTotal(response.total)
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to load reports'
        setError(message)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [statusFilter, typeFilter, page, limit])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const handleStatusFilterChange = (status: '' | 'pending' | 'under_review' | 'resolved' | 'dismissed') => {
    setStatusFilter(status)
    setPage(1)
  }

  const handleTypeFilterChange = (type: '' | 'listing' | 'user') => {
    setTypeFilter(type)
    setPage(1)
  }

  const handleUpdateStatus = async (
    reportId: string,
    status: 'under_review' | 'resolved' | 'dismissed',
    notes?: string,
  ) => {
    if (operationInProgress) return

    setOperationInProgress(true)
    try {
      const { updateAdminReport } = await import('../../services/admin')
      await updateAdminReport(reportId, { status, resolutionNotes: notes })
      await loadReports()
      setViewingReport(null)
      setShowResolutionForm(null)
      setResolutionNotes('')
      addToast(`Report ${status} successfully`, 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update report'
      addToast(message, 'error')
    } finally {
      if (isMountedRef.current) {
        setOperationInProgress(false)
      }
    }
  }

  const handleResolutionSubmit = (status: 'resolved' | 'dismissed') => {
    if (!viewingReport) return
    handleUpdateStatus(viewingReport.id, status, resolutionNotes.trim() || undefined)
  }

  const handleDelete = async () => {
    if (operationInProgress || !reportPendingDeletion) return

    setOperationInProgress(true)
    try {
      const { deleteAdminReport } = await import('../../services/admin')
      await deleteAdminReport(reportPendingDeletion.id)
      await loadReports()
      setViewingReport(null)
      setReportPendingDeletion(null)
      addToast('Report deleted successfully', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete report'
      addToast(message, 'error')
    } finally {
      if (isMountedRef.current) {
        setOperationInProgress(false)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date(dateString))
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800',
    }
    return styles[status as keyof typeof styles] || styles.pending
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          Status:
          <select
            value={statusFilter}
            onChange={(e) =>
              handleStatusFilterChange(
                e.target.value as '' | 'pending' | 'under_review' | 'resolved' | 'dismissed',
              )
            }
            className="rounded-md border border-slate-300 px-3 py-1 text-sm"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          Type:
          <select
            value={typeFilter}
            onChange={(e) => handleTypeFilterChange(e.target.value as '' | 'listing' | 'user')}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm"
          >
            <option value="">All</option>
            <option value="listing">Listing</option>
            <option value="user">User</option>
          </select>
        </label>
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <div className="text-slate-500">Loading reports...</div>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <strong>Error:</strong> {error}
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <div className="text-slate-500">No reports found</div>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Reporter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-800">
                        {report.reportType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {report.reportType === 'listing' && report.reportedListing ? (
                        <div>
                          <div className="font-medium">{report.reportedListing.title}</div>
                          <div className="text-xs text-slate-500">
                            by {report.reportedListing.owner.name}
                          </div>
                        </div>
                      ) : report.reportType === 'user' && report.reportedUser ? (
                        <div>
                          <div className="font-medium">{report.reportedUser.name}</div>
                          <div className="text-xs text-slate-500">{report.reportedUser.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                      <div>{report.reporter.name}</div>
                      <div className="text-xs text-slate-500">{report.reporter.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      <div className="max-w-xs truncate">{report.reason}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadge(report.status)}`}
                      >
                        {report.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {formatDate(report.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => setViewingReport(report)}
                        className="text-primary hover:text-primary/80"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between rounded-lg bg-white px-6 py-4 shadow">
              <div className="text-sm text-slate-700">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}{' '}
                reports
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * limit >= total}
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Report detail modal */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Report Details</h2>
              <button
                type="button"
                onClick={() => {
                  setViewingReport(null)
                  setShowResolutionForm(null)
                  setResolutionNotes('')
                  setReportPendingDeletion(null)
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={operationInProgress}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Report Type</label>
                <div className="mt-1 text-gray-900">{viewingReport.reportType}</div>
              </div>

              {viewingReport.reportType === 'listing' && viewingReport.reportedListing && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Reported Listing</label>
                  <div className="mt-1 text-gray-900">
                    <div className="font-medium">{viewingReport.reportedListing.title}</div>
                    <div className="text-sm text-gray-500">
                      Owner: {viewingReport.reportedListing.owner.name}
                    </div>
                  </div>
                </div>
              )}

              {viewingReport.reportType === 'user' && viewingReport.reportedUser && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Reported User</label>
                  <div className="mt-1 text-gray-900">
                    <div className="font-medium">{viewingReport.reportedUser.name}</div>
                    <div className="text-sm text-gray-500">{viewingReport.reportedUser.email}</div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Reporter</label>
                <div className="mt-1 text-gray-900">
                  <div>{viewingReport.reporter.name}</div>
                  <div className="text-sm text-gray-500">{viewingReport.reporter.email}</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Reason</label>
                <div className="mt-1 text-gray-900">{viewingReport.reason}</div>
              </div>

              {viewingReport.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <div className="mt-1 whitespace-pre-wrap text-gray-900">
                    {viewingReport.description}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadge(viewingReport.status)}`}
                  >
                    {viewingReport.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {viewingReport.resolutionNotes && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Resolution Notes</label>
                  <div className="mt-1 whitespace-pre-wrap text-gray-900">
                    {viewingReport.resolutionNotes}
                  </div>
                </div>
              )}

              {viewingReport.reviewedBy && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Reviewed By</label>
                  <div className="mt-1 text-gray-900">{viewingReport.reviewedBy.name}</div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Created At</label>
                <div className="mt-1 text-gray-900">{formatDate(viewingReport.createdAt)}</div>
              </div>

              {viewingReport.resolvedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Resolved At</label>
                  <div className="mt-1 text-gray-900">{formatDate(viewingReport.resolvedAt)}</div>
                </div>
              )}

              {/* Action buttons */}
              <div className="border-t border-gray-200 pt-4">
                {showResolutionForm ? (
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="resolution-notes" className="block text-sm font-medium text-gray-700">
                        {showResolutionForm === 'resolved' ? 'Resolution notes' : 'Dismissal reason'} (optional)
                      </label>
                      <textarea
                        id="resolution-notes"
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Enter additional notes about this decision..."
                        disabled={operationInProgress}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleResolutionSubmit(showResolutionForm)}
                        disabled={operationInProgress}
                        className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                          showResolutionForm === 'resolved'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        {operationInProgress ? 'Submitting...' : `Confirm ${showResolutionForm === 'resolved' ? 'Resolution' : 'Dismissal'}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowResolutionForm(null)
                          setResolutionNotes('')
                        }}
                        disabled={operationInProgress}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {viewingReport.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(viewingReport.id, 'under_review')}
                        disabled={operationInProgress}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        Mark as Under Review
                      </button>
                    )}
                    {(viewingReport.status === 'pending' || viewingReport.status === 'under_review') && (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowResolutionForm('resolved')}
                          disabled={operationInProgress}
                          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          Mark as Resolved
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowResolutionForm('dismissed')}
                          disabled={operationInProgress}
                          className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setReportPendingDeletion(viewingReport)}
                      disabled={operationInProgress}
                      className="rounded-md border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Delete Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {reportPendingDeletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Delete Report</h2>
            <p className="mb-6 text-sm text-slate-600">
              Are you sure you want to delete this report? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (operationInProgress) return
                  setReportPendingDeletion(null)
                }}
                disabled={operationInProgress}
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={operationInProgress}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {operationInProgress ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
