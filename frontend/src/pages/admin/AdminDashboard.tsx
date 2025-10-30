import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { FormEvent, ReactNode } from "react"

import ListingDetailsForm from "../../components/listings/ListingDetailsForm"
import { CONTACT_OPTIONS } from "../../constants/listings"
import {
  createListingValidators,
  validateListingField,
  validateListingValues,
  type ListingFormErrors,
  type ListingFormValues,
} from "../../lib/listingForm"
import {
  approveListing,
  banUser,
  deleteListing,
  fetchAdminListings,
  fetchAdminUsers,
  rejectListing,
  unbanUser,
  updateAdminListing,
  type AdminListingRow,
  type AdminUserRow,
  type ModerationStatus,
} from "../../services/admin"
import { fetchListingCategories, type ListingCategory } from "../../services/listings"

const statusStyles: Record<ModerationStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
}

type ToastMessage = {
  id: number
  type: "success" | "error"
  message: string
}

const Modal = ({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-6">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Close
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  )
}

const AdminDashboard = () => {
  const [listings, setListings] = useState<AdminListingRow[]>([])
  const [listingsStatus, setListingsStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [listingsError, setListingsError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ModerationStatus | "all">("pending")
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [categories, setCategories] = useState<ListingCategory[]>([])
  const [categoriesStatus, setCategoriesStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [usersStatus, setUsersStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [usersError, setUsersError] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const toastTimeoutRef = useRef<number | null>(null)

  const [editListing, setEditListing] = useState<AdminListingRow | null>(null)
  const [editValues, setEditValues] = useState<ListingFormValues | null>(null)
  const [editErrors, setEditErrors] = useState<ListingFormErrors>({})
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editSubmitError, setEditSubmitError] = useState<string | null>(null)

  const [rejectListingTarget, setRejectListingTarget] = useState<AdminListingRow | null>(null)
  const [rejectNotes, setRejectNotes] = useState("")
  const [rejectError, setRejectError] = useState<string | null>(null)
  const [isRejecting, setIsRejecting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<AdminListingRow | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [listingAction, setListingAction] = useState<{ id: string; type: "approve" | "reject" | "delete" } | null>(null)
  const [userActionId, setUserActionId] = useState<string | null>(null)

  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [])

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ id: Date.now(), message, type })
  }, [])

  useEffect(() => {
    if (!toast) {
      return
    }
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current)
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null)
    }, 4000)
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [toast])

  const loadCategories = useCallback(async () => {
    setCategoriesStatus("loading")
    setCategoriesError(null)
    try {
      const result = await fetchListingCategories()
      if (!isMountedRef.current) {
        return
      }
      setCategories(result)
      setCategoriesStatus("success")
    } catch (error) {
      if (!isMountedRef.current) {
        return
      }
      setCategoriesStatus("error")
      const message = error instanceof Error ? error.message : "Unable to load categories."
      setCategoriesError(message)
    }
  }, [])

  const loadListings = useCallback(async () => {
    setListingsStatus("loading")
    setListingsError(null)
    try {
      const result = await fetchAdminListings({
        status: statusFilter,
        search: searchTerm || undefined,
      })
      if (!isMountedRef.current) {
        return
      }
      setListings(result)
      setListingsStatus("success")
    } catch (error) {
      if (!isMountedRef.current) {
        return
      }
      setListingsStatus("error")
      const message = error instanceof Error ? error.message : "Unable to load listings."
      setListingsError(message)
    }
  }, [searchTerm, statusFilter])

  const loadUsers = useCallback(async () => {
    setUsersStatus("loading")
    setUsersError(null)
    try {
      const result = await fetchAdminUsers()
      if (!isMountedRef.current) {
        return
      }
      setUsers(result)
      setUsersStatus("success")
    } catch (error) {
      if (!isMountedRef.current) {
        return
      }
      setUsersStatus("error")
      const message = error instanceof Error ? error.message : "Unable to load users."
      setUsersError(message)
    }
  }, [])

  useEffect(() => {
    loadCategories().catch(() => undefined)
    loadListings().catch(() => undefined)
    loadUsers().catch(() => undefined)
  }, [loadCategories, loadListings, loadUsers])

  useEffect(() => {
    loadListings().catch(() => undefined)
  }, [loadListings])

  const editValidators = useMemo(
    () => createListingValidators(categories, { includeModeration: true }),
    [categories],
  )

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSearchTerm(searchInput.trim())
  }

  const openEditModal = (listing: AdminListingRow) => {
    setEditListing(listing)
    setEditValues({
      title: listing.title,
      description: listing.description,
      price: listing.price,
      category: listing.category?.id ?? "",
      availability: listing.availability,
      contactPreference: listing.contactPreference,
      active: listing.isActive,
      moderationStatus: listing.moderation.status,
      moderationNotes: listing.moderation.notes ?? "",
    })
    setEditErrors({})
    setEditSubmitError(null)
  }

  const closeEditModal = () => {
    setEditListing(null)
    setEditValues(null)
    setEditErrors({})
    setEditSubmitError(null)
  }

  const updateEditValue = <Field extends keyof ListingFormValues>(field: Field, value: ListingFormValues[Field]) => {
    if (!editValues) {
      return
    }
    const nextValues = { ...editValues, [field]: value }
    setEditValues(nextValues)
    if (editErrors[field]) {
      setEditErrors((prev) => ({
        ...prev,
        [field]: validateListingField(field, value, nextValues, editValidators),
      }))
    }
  }

  const validateEditField = <Field extends keyof ListingFormValues>(field: Field) => {
    if (!editValues) {
      return ""
    }
    const error = editValidators[field](editValues)
    setEditErrors((prev) => ({ ...prev, [field]: error }))
    return error
  }

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editValues || !editListing) {
      return
    }
    const nextErrors = validateListingValues(editValues, editValidators)
    setEditErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }
    setIsSavingEdit(true)
    setEditSubmitError(null)
    try {
      const updated = await updateAdminListing(editListing.id, {
        title: editValues.title.trim(),
        description: editValues.description.trim(),
        price: editValues.price.trim(),
        isActive: editValues.active,
        categoryId: editValues.category || null,
        availability: editValues.availability.trim(),
        contactPreference: editValues.contactPreference,
        moderationStatus: editValues.moderationStatus ?? "pending",
        moderationNotes: editValues.moderationNotes?.trim() || null,
      })
      if (!isMountedRef.current) {
        return
      }
      setListings((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setEditListing(updated)
      setEditValues({
        title: updated.title,
        description: updated.description,
        price: updated.price,
        category: updated.category?.id ?? "",
        availability: updated.availability,
        contactPreference: updated.contactPreference,
        active: updated.isActive,
        moderationStatus: updated.moderation.status,
        moderationNotes: updated.moderation.notes ?? "",
      })
      showToast("Listing updated successfully.")
      closeEditModal()
    } catch (error) {
      if (!isMountedRef.current) {
        return
      }
      const message = error instanceof Error ? error.message : "Unable to update listing."
      setEditSubmitError(message)
      showToast(message, "error")
    } finally {
      if (isMountedRef.current) {
        setIsSavingEdit(false)
      }
    }
  }

  const handleApprove = async (listing: AdminListingRow) => {
    setListingAction({ id: listing.id, type: "approve" })
    try {
      const updated = await approveListing(listing.id, { moderationNotes: listing.moderation.notes ?? undefined })
      if (!isMountedRef.current) {
        return
      }
      setListings((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      showToast("Listing approved.")
    } catch (error) {
      if (!isMountedRef.current) {
        return
      }
      const message = error instanceof Error ? error.message : "Unable to approve listing."
      showToast(message, "error")
    } finally {
      if (isMountedRef.current) {
        setListingAction(null)
      }
    }
  }

  const openRejectModal = (listing: AdminListingRow) => {
    setRejectListingTarget(listing)
    setRejectNotes(listing.moderation.notes ?? "")
    setRejectError(null)
  }

  const closeRejectModal = () => {
    setRejectListingTarget(null)
    setRejectNotes("")
    setRejectError(null)
  }

  const handleRejectSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!rejectListingTarget) {
      return
    }
    if (!rejectNotes.trim()) {
      setRejectError("Please provide a reason for rejection.")
      return
    }
    setIsRejecting(true)
    setListingAction({ id: rejectListingTarget.id, type: "reject" })
    try {
      const updated = await rejectListing(rejectListingTarget.id, {
        moderationNotes: rejectNotes.trim(),
      })
      if (!isMountedRef.current) {
        return
      }
      setListings((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      showToast("Listing rejected.")
      closeRejectModal()
    } catch (error) {
      if (!isMountedRef.current) {
        return
      }
      const message = error instanceof Error ? error.message : "Unable to reject listing."
      setRejectError(message)
      showToast(message, "error")
    } finally {
      if (isMountedRef.current) {
        setIsRejecting(false)
        setListingAction(null)
      }
    }
  }

  const openDeleteModal = (listing: AdminListingRow) => {
    setDeleteTarget(listing)
    setDeleteError(null)
  }

  const closeDeleteModal = () => {
    setDeleteTarget(null)
    setDeleteError(null)
    setIsDeleting(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) {
      return
    }
    setIsDeleting(true)
    setListingAction({ id: deleteTarget.id, type: "delete" })
    try {
      await deleteListing(deleteTarget.id)
      if (!isMountedRef.current) {
        return
      }
      setListings((prev) => prev.filter((item) => item.id !== deleteTarget.id))
      showToast("Listing deleted.")
      closeDeleteModal()
    } catch (error) {
      if (!isMountedRef.current) {
        return
      }
      const message = error instanceof Error ? error.message : "Unable to delete listing."
      setDeleteError(message)
      showToast(message, "error")
      setIsDeleting(false)
      setListingAction(null)
    }
  }

  const handleBanToggle = async (user: AdminUserRow) => {
    if (!user.isBanned) {
      const reason = window.prompt("Provide a reason for banning this user:", user.banReason ?? "")
      if (!reason || !reason.trim()) {
        showToast("Ban cancelled. Provide a reason to ban a user.", "error")
        return
      }
      setUserActionId(user.id)
      try {
        const updated = await banUser(user.id, { reason: reason.trim() })
        if (!isMountedRef.current) {
          return
        }
        setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        showToast("User banned.")
      } catch (error) {
        if (!isMountedRef.current) {
          return
        }
        const message = error instanceof Error ? error.message : "Unable to ban user."
        showToast(message, "error")
      } finally {
        if (isMountedRef.current) {
          setUserActionId(null)
        }
      }
      return
    }

    setUserActionId(user.id)
    try {
      const updated = await unbanUser(user.id)
      if (!isMountedRef.current) {
        return
      }
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      showToast("User unbanned.")
    } catch (error) {
      if (!isMountedRef.current) {
        return
      }
      const message = error instanceof Error ? error.message : "Unable to update user status."
      showToast(message, "error")
    } finally {
      if (isMountedRef.current) {
        setUserActionId(null)
      }
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 lg:px-6" data-testid="admin-dashboard">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-primary">Admin Dashboard</h1>
        <p className="text-sm text-slate-600">
          Review new listings, manage moderation decisions, and keep community members in good standing.
        </p>
        {toast ? (
          <div
            key={toast.id}
            role="status"
            aria-live="assertive"
            className={`mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm shadow-sm ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {toast.message}
          </div>
        ) : null}
      </header>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Listings moderation</h2>
            <p className="text-sm text-slate-500">Approve, edit, or reject listings awaiting review.</p>
          </div>
          <form className="flex flex-col gap-2 sm:flex-row sm:items-center" onSubmit={handleFilterSubmit}>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ModerationStatus | "all")}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <span className="sr-only">Search listings</span>
              <input
                type="search"
                placeholder="Search listings"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-1 text-sm"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-primary px-4 py-1 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("pending")
                setSearchInput("")
                setSearchTerm("")
              }}
              className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Reset
            </button>
          </form>
        </div>

        {listingsStatus === "loading" ? (
          <p className="text-sm text-slate-500">Loading listings…</p>
        ) : listingsStatus === "error" ? (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span>{listingsError}</span>
            <button
              type="button"
              onClick={() => loadListings().catch(() => undefined)}
              className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Retry
            </button>
          </div>
        ) : listings.length === 0 ? (
          <p className="text-sm text-slate-500">No listings match the current filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200" data-testid="admin-listings-table">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-3 py-3">Listing</th>
                  <th scope="col" className="px-3 py-3">Owner</th>
                  <th scope="col" className="px-3 py-3">Status</th>
                  <th scope="col" className="px-3 py-3">Updated</th>
                  <th scope="col" className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-sm">
                {listings.map((listing) => (
                  <tr key={listing.id} data-testid="admin-listing-row" className="align-top">
                    <td className="px-3 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{listing.title}</span>
                        <span className="text-xs text-slate-500">{listing.category?.name ?? "Uncategorized"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{listing.owner.name}</span>
                        <span className="text-xs text-slate-500">{listing.owner.email}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${statusStyles[listing.moderation.status]}`}
                      >
                        {listing.moderation.status.charAt(0).toUpperCase() + listing.moderation.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      Updated {new Date(listing.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(listing)}
                          disabled={listingAction?.id === listing.id && listingAction.type === "approve"}
                          className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {listingAction?.id === listing.id && listingAction.type === "approve" ? "Approving…" : "Approve"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openRejectModal(listing)}
                          disabled={listingAction?.id === listing.id && listingAction.type === "reject"}
                          className="rounded-full border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(listing)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(listing)}
                          disabled={listingAction?.id === listing.id && listingAction.type === "delete"}
                          className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {listingAction?.id === listing.id && listingAction.type === "delete" ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">User management</h2>
            <p className="text-sm text-slate-500">Monitor member status and manage bans.</p>
          </div>
          <button
            type="button"
            onClick={() => loadUsers().catch(() => undefined)}
            className="self-start rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        {usersStatus === "loading" ? (
          <p className="text-sm text-slate-500">Loading users…</p>
        ) : usersStatus === "error" ? (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span>{usersError}</span>
            <button
              type="button"
              onClick={() => loadUsers().catch(() => undefined)}
              className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-500">No users found.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2" data-testid="admin-users-panel">
            {users.map((user) => (
              <div
                key={user.id}
                className={`flex flex-col gap-2 rounded-xl border px-4 py-3 shadow-sm transition ${
                  user.isBanned ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{user.role}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Joined {new Date(user.joinedAt).toLocaleDateString()}
                </div>
                {user.isBanned ? (
                  <div className="text-xs text-rose-600">
                    {user.banReason ? `Banned: ${user.banReason}` : "Banned"}
                    {user.banExpiresAt ? ` (until ${new Date(user.banExpiresAt).toLocaleString()})` : ""}
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleBanToggle(user)}
                  disabled={userActionId === user.id}
                  className={`mt-2 inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold transition ${
                    user.isBanned
                      ? "border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      : "border border-rose-200 text-rose-700 hover:bg-rose-50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {userActionId === user.id ? "Processing…" : user.isBanned ? "Lift ban" : "Ban user"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {editListing && editValues ? (
        <Modal title={`Edit listing – ${editListing.title}`} onClose={closeEditModal}>
          <form className="flex flex-col gap-6" onSubmit={handleEditSubmit}>
            <ListingDetailsForm
              values={editValues}
              errors={editErrors}
              categories={categories}
              categoriesStatus={categoriesStatus}
              categoriesError={categoriesError}
              onRetryCategories={loadCategories}
              onChange={updateEditValue}
              onBlur={validateEditField}
              contactOptions={CONTACT_OPTIONS}
              includeModerationFields
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full border border-slate-200 px-4 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/70"
              >
                {isSavingEdit ? "Saving…" : "Save changes"}
              </button>
            </div>
            {isSavingEdit ? (
              <span className="text-xs text-slate-500" role="status" aria-live="polite">
                Updating listing…
              </span>
            ) : null}
            {editSubmitError ? (
              <span className="text-xs text-rose-600" role="alert">
                {editSubmitError}
              </span>
            ) : null}
          </form>
        </Modal>
      ) : null}

      {rejectListingTarget ? (
        <Modal title={`Reject listing – ${rejectListingTarget.title}`} onClose={closeRejectModal}>
          <form className="flex flex-col gap-4" onSubmit={handleRejectSubmit}>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              <span>Provide rejection reason</span>
              <textarea
                value={rejectNotes}
                onChange={(event) => setRejectNotes(event.target.value)}
                rows={4}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            {rejectError ? (
              <span className="text-xs text-rose-600" role="alert">
                {rejectError}
              </span>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={closeRejectModal}
                className="rounded-full border border-slate-200 px-4 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRejecting}
                className="rounded-full border border-rose-200 bg-rose-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-rose-300"
              >
                {isRejecting ? "Rejecting…" : "Reject listing"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {deleteTarget ? (
        <Modal title={`Delete listing – ${deleteTarget.title}`} onClose={closeDeleteModal}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-600">
              This action will permanently remove the listing and its associated information. Are you sure you want to proceed?
            </p>
            {deleteError ? (
              <span className="text-xs text-rose-600" role="alert">
                {deleteError}
              </span>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="rounded-full border border-slate-200 px-4 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-full border border-rose-200 bg-rose-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-rose-300"
              >
                {isDeleting ? "Deleting…" : "Delete listing"}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

export default AdminDashboard
