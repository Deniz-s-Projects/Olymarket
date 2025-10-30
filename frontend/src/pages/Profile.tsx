import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import { NavLink } from "react-router-dom"

import ListingTable, {
  type ProfileListingRow,
} from "../components/profile/ListingTable"
import { useAuth } from "../context/useAuth"
import { ApiError } from "../lib/apiClient"
import { fetchListings } from "../services/listings"
import { fetchProfile, upsertProfile } from "../services/profile"
import type { ProfileDetails } from "../types/profile"
import type { FormStatus } from "../hooks/useFormValidation"

const formatDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(value))
  } catch (error) {
    return value
  }
}

const formatCurrency = (value: string) => {
  const amount = Number(value)
  if (Number.isNaN(amount)) {
    return value
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

const Profile = () => {
  const { user, token, isHydrated, login: updateAuth } = useAuth()
  const [profile, setProfile] = useState<ProfileDetails | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [formStatus, setFormStatus] = useState<FormStatus>("idle")
  const [formFeedback, setFormFeedback] = useState("")
  const [formValues, setFormValues] = useState({
    name: user?.name ?? "",
    location: "",
    bio: "",
    notifyNewListings: true,
  })
  const [listings, setListings] = useState<ProfileListingRow[]>([])
  const [isLoadingListings, setIsLoadingListings] = useState(false)

  useEffect(() => {
    if (!user) {
      return
    }

    let isActive = true
    setProfileError(null)

    fetchProfile()
      .then(({ profile: nextProfile }) => {
        if (!isActive) return
        setProfile(nextProfile)
        setFormValues({
          name: nextProfile.name,
          location: nextProfile.location ?? "",
          bio: nextProfile.bio ?? "",
          notifyNewListings: nextProfile.notifyNewListings,
        })
      })
      .catch((error) => {
        if (!isActive) return
        if (error instanceof ApiError && error.status === 404) {
          setProfile(null)
          setFormValues({
            name: user.name,
            location: "",
            bio: "",
            notifyNewListings: true,
          })
          setProfileError(
            "Tell other buyers and sellers a little about yourself to complete your profile.",
          )
        } else {
          setProfileError("We couldn't load your profile information right now.")
        }
      })
      .finally(() => {
        if (!isActive) return
      })

    return () => {
      isActive = false
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      return
    }

    let isActive = true
    setIsLoadingListings(true)

    fetchListings()
      .then((allListings) => {
        if (!isActive) return
        const rows = allListings
          .filter((listing) => listing.owner.id === user.id)
          .map<ProfileListingRow>((listing) => ({
            id: listing.id,
            title: listing.title,
            categoryLabel: listing.category?.name ?? "Uncategorized",
            priceLabel: formatCurrency(listing.price),
            statusLabel: listing.isActive ? "active" : "inactive",
            updatedAtLabel: formatDate(listing.updatedAt),
          }))
        setListings(rows)
      })
      .catch(() => {
        if (!isActive) return
        setListings([])
      })
      .finally(() => {
        if (!isActive) return
        setIsLoadingListings(false)
      })

    return () => {
      isActive = false
    }
  }, [user])

  const memberSince = useMemo(() => {
    if (!profile?.memberSince) {
      return null
    }
    return formatDate(profile.memberSince)
  }, [profile?.memberSince])

  if (!isHydrated) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-4 py-24 text-slate-500">
        Checking your profile...
      </section>
    )
  }

  if (!user) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">You're not signed in</h1>
        <p className="max-w-md text-sm text-slate-600">
          Sign in to access your profile dashboard, manage listings, and review your saved
          items.
        </p>
        <NavLink
          to="/auth"
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          Go to sign in
        </NavLink>
      </section>
    )
  }

  const handleInputChange = (field: "name" | "location" | "bio") =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target
      setFormValues((prev) => ({ ...prev, [field]: value }))
    }

  const handleNotifyChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev) => ({ ...prev, notifyNewListings: event.target.checked }))
  }

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formValues.name.trim()) {
      setFormStatus("error")
      setFormFeedback("Your name is required to complete your profile.")
      return
    }

    setFormStatus("loading")
    setFormFeedback("Saving your profile details...")

    try {
      const response = await upsertProfile({
        name: formValues.name.trim(),
        location: formValues.location.trim() || undefined,
        bio: formValues.bio.trim() || undefined,
        notifyNewListings: formValues.notifyNewListings,
      })

      setProfile(response.profile)
      setProfileError(null)
      setFormStatus("success")
      setFormFeedback("Profile updated successfully!")

      if (token) {
        updateAuth({ user: response.user, token })
      }
    } catch (error) {
      const apiError = error as ApiError
      setFormStatus("error")
      if (apiError?.message) {
        setFormFeedback(apiError.message)
      } else {
        setFormFeedback("We couldn't save your changes right now. Please try again.")
      }
    }
  }

  const statusTone = formStatus === "error" ? "text-red-600" : formStatus === "success" ? "text-green-600" : formStatus === "loading" ? "text-slate-600" : "text-slate-400"

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 lg:px-0">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Your profile</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Personalize how you show up to other marketplace members and control whether you
          receive alerts when new listings are posted.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <form
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          onSubmit={handleProfileSubmit}
          noValidate
        >
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">Profile details</h2>
            <p className="text-sm text-slate-500">
              Share your preferred name, location, and a short bio so buyers and sellers know
              who they're working with.
            </p>
          </div>

          {profileError ? (
            <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
              {profileError}
            </p>
          ) : null}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700" htmlFor="profile-name">
                Display name
              </label>
              <input
                id="profile-name"
                type="text"
                value={formValues.name}
                onChange={handleInputChange("name")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Jamie Lawson"
                autoComplete="name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700" htmlFor="profile-location">
                Location
              </label>
              <input
                id="profile-location"
                type="text"
                value={formValues.location}
                onChange={handleInputChange("location")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Seattle, WA"
                autoComplete="address-level2"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700" htmlFor="profile-bio">
                Bio
              </label>
              <textarea
                id="profile-bio"
                value={formValues.bio}
                onChange={handleInputChange("bio")}
                className="min-h-[120px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Share your interests, specialties, or what you enjoy buying and selling."
              />
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                checked={formValues.notifyNewListings}
                onChange={handleNotifyChange}
              />
              <span>
                <span className="block text-sm font-semibold text-slate-900">
                  Email me when new listings are posted
                </span>
                Stay up to date with the latest items so you can make an offer before anyone else.
              </span>
            </label>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-500">
              {memberSince ? `Member since ${memberSince}` : ""}
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                disabled={formStatus === "loading"}
              >
                {formStatus === "loading" ? "Saving..." : "Save profile"}
              </button>
              {formFeedback ? (
                <span className={`text-xs ${statusTone}`}>{formFeedback}</span>
              ) : null}
            </div>
          </div>
        </form>

        <aside className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Account summary</h2>
          <dl className="space-y-3 text-sm text-slate-600">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </dt>
              <dd className="text-base font-medium text-slate-900">{user.email}</dd>
            </div>
            {profile?.location ? (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Location
                </dt>
                <dd>{profile.location}</dd>
              </div>
            ) : null}
            {profile?.bio ? (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Bio
                </dt>
                <dd className="leading-relaxed">{profile.bio}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Alerts
              </dt>
              <dd>{formValues.notifyNewListings ? "Enabled" : "Disabled"}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Your listings</h2>
          <NavLink
            to="/listings/new"
            className="inline-flex items-center justify-center rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
          >
            Create listing
          </NavLink>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Keep track of the items you've posted and see their current status at a glance.
        </p>
        <div className="mt-6">
          <ListingTable
            title="Active listings"
            listings={listings}
            emptyMessage={
              isLoadingListings
                ? "Loading your listings..."
                : "You haven't posted any listings yet. Start by sharing something you want to sell."
            }
          />
        </div>
      </section>
    </section>
  )
}

export default Profile
