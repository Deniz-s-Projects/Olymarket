import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import PriceInput from "../components/forms/PriceInput"
import TextArea from "../components/forms/TextArea"
import TextInput from "../components/forms/TextInput"
import ToggleSwitch from "../components/forms/ToggleSwitch"
import PhotoUploadField, {
  type PhotoPreview,
} from "../components/forms/PhotoUploadField"
import { ApiError } from "../lib/apiClient"
import { useAuth } from "../context/AuthContext"
import {
  createListing,
  fetchListingCategories,
  type ListingCategory,
} from "../services/listings"

type ListingFormValues = {
  title: string
  description: string
  price: string
  category: string
  availability: string
  contactPreference: string
  active: boolean
}

type ListingFormErrors = Partial<Record<keyof ListingFormValues, string>>

const INITIAL_VALUES: ListingFormValues = {
  title: "",
  description: "",
  price: "",
  category: "",
  availability: "",
  contactPreference: "",
  active: true,
}

const CONTACT_OPTIONS = ["Email", "Phone", "In-app messaging"]
const MAX_PHOTOS = 6

type ValidatorMap = {
  [Field in keyof ListingFormValues]: (value: ListingFormValues[Field]) => string
}

const CreateListing = () => {
  const navigate = useNavigate()
  const { token } = useAuth()
  const isMountedRef = useRef(true)
  const [values, setValues] = useState<ListingFormValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<ListingFormErrors>({})
  const [photos, setPhotos] = useState<PhotoPreview[]>([])
  const [categories, setCategories] = useState<ListingCategory[]>([])
  const [categoriesStatus, setCategoriesStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (token === null) {
      navigate("/auth", {
        replace: true,
        state: {
          from: "/listings/new",
          message: "Please sign in to create a listing.",
        },
      })
    }
  }, [navigate, token])

  const loadCategories = useCallback(async () => {
    if (!isMountedRef.current) {
      return
    }

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
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load categories. Please try again."
      setCategoriesError(message)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const validators = useMemo<ValidatorMap>(
    () => ({
      title: (value: string) => {
        if (!value.trim()) return "A title is required."
        if (value.trim().length < 5) return "Titles should be at least 5 characters long."
        return ""
      },
      description: (value: string) => {
        if (!value.trim()) return "Describe your listing so buyers know what to expect."
        if (value.trim().length < 20)
          return "Please provide a bit more detail (minimum 20 characters)."
        return ""
      },
      price: (value: string) => {
        if (!value.trim()) return "Set a price for the listing."
        const numeric = Number(value)
        if (Number.isNaN(numeric) || numeric <= 0) return "Price must be a positive number."
        return ""
      },
      category: (value: string) => {
        if (!value) return ""
        const exists = categories.some((category) => category.id === value)
        return exists ? "" : "Select a valid category."
      },
      availability: (value: string) => {
        if (!value.trim()) return "Let buyers know when this listing is available."
        return ""
      },
      contactPreference: (value: string) => {
        if (!value) return "Choose how you prefer to be contacted."
        return ""
      },
      active: () => "",
    }),
    [categories]
  )

  useEffect(() => {
    return () => {
      photos.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [photos])

  const runValidator = <Field extends keyof ListingFormValues>(field: Field, value: ListingFormValues[Field]) =>
    validators[field](value)

  const updateValue = <Field extends keyof ListingFormValues>(field: Field, value: ListingFormValues[Field]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: runValidator(field, value) }))
    }
  }

  const validateField = <Field extends keyof ListingFormValues>(field: Field) => {
    const error = runValidator(field, values[field])
    setErrors((prev) => ({ ...prev, [field]: error }))
    return error
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = (Object.keys(values) as Array<keyof ListingFormValues>).reduce<ListingFormErrors>(
      (acc, field) => {
        const error = runValidator(field, values[field])
        if (error) acc[field] = error
        return acc
      },
      {}
    )
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length === 0) {
      if (!token) {
        navigate("/auth", {
          replace: true,
          state: {
            from: "/listings/new",
            message: "Please sign in to create a listing.",
          },
        })
        return
      }

      setSubmitError(null)
      setIsSubmitting(true)

      try {
        const listing = await createListing({
          title: values.title.trim(),
          description: values.description.trim(),
          price: values.price.trim(),
          isActive: values.active,
          categoryId: values.category || undefined,
        })

        navigate("/profile", {
          replace: true,
          state: {
            message: "Your listing has been created.",
            listingId: listing.id,
          },
        })
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          navigate("/auth", {
            replace: true,
            state: {
              from: "/listings/new",
              message: "Please sign in to create a listing.",
            },
          })
          return
        }

        if (!isMountedRef.current) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : "Something went wrong while saving your listing."
        setSubmitError(message)
      } finally {
        if (isMountedRef.current) {
          setIsSubmitting(false)
        }
      }
    }
  }

  const handlePhotoSelection = (files: FileList | null) => {
    if (!files?.length) return

    setPhotos((prev) => {
      const newPreviews = Array.from(files).map<PhotoPreview>((file) => ({
        id: `${file.name}-${file.lastModified}-${
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2)
        }`,
        url: URL.createObjectURL(file),
        fileName: file.name,
      }))

      return [...prev, ...newPreviews].slice(0, MAX_PHOTOS)
    })
  }

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const removed = prev.find((preview) => preview.id === id)
      if (removed) {
        URL.revokeObjectURL(removed.url)
      }
      return prev.filter((preview) => preview.id !== id)
    })
  }

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-primary">Create a Listing</h1>
        <p className="text-base text-slate-600">
          Share the details of what you&apos;re offering so buyers know exactly what to expect.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        <section className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Basic information</h2>
            <p className="text-sm text-slate-500">This information appears at the top of your listing.</p>
          </div>
          <TextInput
            label="Title"
            name="title"
            placeholder="e.g., Premium rowing machine rental"
            value={values.title}
            onChange={(value) => updateValue("title", value)}
            onBlur={() => validateField("title")}
            error={errors.title}
            required
          />
          <TextArea
            label="Description"
            name="description"
            placeholder="Describe the condition, what&apos;s included, and any other relevant details."
            value={values.description}
            onChange={(value) => updateValue("description", value)}
            onBlur={() => validateField("description")}
            error={errors.description}
            required
            rows={6}
          />
        </section>

        <section className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Pricing &amp; discovery</h2>
            <p className="text-sm text-slate-500">Help buyers understand the cost and how to find your listing.</p>
          </div>
          <PriceInput
            label="Price"
            name="price"
            placeholder="0.00"
            value={values.price}
            onChange={(value) => updateValue("price", value)}
            onBlur={() => validateField("price")}
            error={errors.price}
            required
          />
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span>
              Category<span className="ml-1 text-xs font-normal text-slate-500">(optional)</span>
            </span>
            <select
              name="category"
              value={values.category}
              onChange={(event) => updateValue("category", event.target.value)}
              onBlur={() => validateField("category")}
              className="rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              aria-invalid={Boolean(errors.category)}
              disabled={categoriesStatus === "loading"}
            >
              <option value="">
                {categoriesStatus === "loading"
                  ? "Loading categories..."
                  : "No category"}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category ? (
              <span className="text-xs font-normal text-red-600">{errors.category}</span>
            ) : null}
            {categoriesStatus === "error" && categoriesError ? (
              <div className="flex items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <span>{categoriesError}</span>
                <button
                  type="button"
                  onClick={loadCategories}
                  className="rounded-full border border-amber-400 px-2 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                >
                  Retry
                </button>
              </div>
            ) : null}
            {categoriesStatus === "success" && categories.length === 0 ? (
              <span className="text-xs font-normal text-slate-500">
                Categories aren&apos;t available yet. You can still create your listing without one.
              </span>
            ) : null}
          </label>
        </section>

        <section className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Availability &amp; preferences</h2>
            <p className="text-sm text-slate-500">Let buyers know when you&apos;re available and the best way to reach you.</p>
          </div>
          <TextInput
            label="Availability details"
            name="availability"
            placeholder="e.g., Weekdays after 5pm"
            value={values.availability}
            onChange={(value) => updateValue("availability", value)}
            onBlur={() => validateField("availability")}
            error={errors.availability}
            required
          />
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span>
              Contact preference<span className="ml-1 text-red-500">*</span>
            </span>
            <select
              name="contactPreference"
              value={values.contactPreference}
              onChange={(event) => updateValue("contactPreference", event.target.value)}
              onBlur={() => validateField("contactPreference")}
              className="rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-invalid={Boolean(errors.contactPreference)}
            >
              <option value="" disabled>
                Select a contact method
              </option>
              {CONTACT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.contactPreference ? (
              <span className="text-xs font-normal text-red-600">{errors.contactPreference}</span>
            ) : null}
          </label>
          <ToggleSwitch
            label="Active listing"
            name="active"
            description="Disable this to hide the listing from buyers without deleting it."
            hint="You can update this status at any time."
            checked={values.active}
            onChange={(checked) => updateValue("active", checked)}
          />
        </section>

        <section className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Photos</h2>
            <p className="text-sm text-slate-500">
              Add up to six images to showcase your listing. Drag-and-drop and upload progress indicators can be wired up later
              using the provided props.
            </p>
          </div>
          <PhotoUploadField
            label="Listing photos"
            name="photos"
            previews={photos}
            onSelectFiles={handlePhotoSelection}
            onRemove={handleRemovePhoto}
            maxItems={MAX_PHOTOS}
            helperText="Square images look best. You can drag and drop files onto this area in a future update."
          />
        </section>

        <div className="flex flex-col items-end gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-primary/70"
          >
            {isSubmitting ? "Creating…" : "Create listing"}
          </button>
          {isSubmitting ? (
            <span className="text-xs text-slate-500" role="status" aria-live="polite">
              Saving your listing…
            </span>
          ) : null}
          {submitError ? (
            <span className="text-xs text-red-600" role="alert">
              {submitError}
            </span>
          ) : null}
        </div>
      </form>
    </section>
  )
}

export default CreateListing
