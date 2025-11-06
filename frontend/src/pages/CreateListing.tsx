import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { FormEvent } from "react"
import { useNavigate, useParams } from "react-router-dom"
import PriceInput from "../components/forms/PriceInput"
import TextArea from "../components/forms/TextArea"
import TextInput from "../components/forms/TextInput"
import ToggleSwitch from "../components/forms/ToggleSwitch"
import ConditionSelector from "../components/forms/ConditionSelector"
import PhotoUploadField, {
  type PhotoPreview,
} from "../components/forms/PhotoUploadField"
import { ApiError } from "../lib/apiClient"
import { useAuth } from "../context/useAuth"
import { optimizeImage } from "../utils/imageOptimization"
import {
  createListing,
  fetchListingCategories,
  fetchListingById,
  updateListing,
  type ListingCategory,
  type ListingCondition,
} from "../services/listings"
import type { ListingStatus } from '../services/listings'
import { DEFAULT_LISTING_CONDITION } from "../constants/listingConditions"
type ListingFormValues = {
  title: string
  description: string
  price: string
  isFree: boolean
  category: string
  availability: string
  preferredContactMethod: string
  active: boolean
  condition: ListingCondition
  showContactInfo: boolean
}

type ListingFormErrors = Partial<Record<keyof ListingFormValues, string>>

const INITIAL_VALUES: ListingFormValues = {
  title: "",
  description: "",
  price: "",
  isFree: false,
  category: "",
  availability: "",
  preferredContactMethod: "",
  active: true,
  condition: DEFAULT_LISTING_CONDITION,
  showContactInfo: true,
}

const DEFAULT_CONTACT_METHOD_OPTIONS = ["Email", "Phone", "In-app messaging"]
const MAX_PHOTOS = 6

type ValidatorMap = {
  [Field in keyof ListingFormValues]: (value: ListingFormValues[Field]) => string
}

const CreateListing = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)
  const { token, user } = useAuth()
  const isMountedRef = useRef(true)
  const [values, setValues] = useState<ListingFormValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<ListingFormErrors>({})
  const [photos, setPhotos] = useState<PhotoPreview[]>([])
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [categories, setCategories] = useState<ListingCategory[]>([])
  const [categoriesStatus, setCategoriesStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isLoadingListing, setIsLoadingListing] = useState(isEditMode)
  const [loadListingError, setLoadListingError] = useState<string | null>(null)

  useEffect(() => {
    isMountedRef.current = true
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

  const loadListing = useCallback(async () => {
    if (!id || !isMountedRef.current) {
      return
    }

    setIsLoadingListing(true)
    setLoadListingError(null)

    try {
      const listing = await fetchListingById(id)

      setValues({
        title: listing.title,
        description: listing.description,
        price: listing.price,
        isFree: listing.isFree,
        category: listing.category?.id || "",
        availability: listing.availability?.trim() ?? "",
        preferredContactMethod: listing.preferredContactMethod?.trim() ?? "",
        active: listing.isActive,
        condition: listing.condition ?? DEFAULT_LISTING_CONDITION,
        showContactInfo: listing.showContactInfo ?? false,
      })

      if (listing.images && listing.images.length > 0) {
        const existingPhotos: PhotoPreview[] = listing.images.map((url, index) => ({
          id: `existing-${index}`,
          url,
          fileName: `Image ${index + 1}`,
        }))
        setPhotos(existingPhotos)
      }

      setIsLoadingListing(false)
    } catch (error) {
      setIsLoadingListing(false)
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load listing. Please try again."
      setLoadListingError(message)
    }
  }, [id])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    if (isEditMode) {
      loadListing()
    }
  }, [isEditMode, loadListing])

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
      isFree: () => "",
      category: (value: string) => {
        const trimmed = value.trim()
        if (!trimmed) return "Select a category to continue."
        const exists = categories.some((category) => category.id === trimmed)
        return exists ? "" : "Select a valid category."
      },
      availability: (value: string) => {
        if (!value.trim()) return "Let buyers know when this listing is available."
        return ""
      },
      condition: (value: ListingCondition) => {
        return value ? "" : "Select the item condition."
      },
      preferredContactMethod: (value: string) => {
        if (!value.trim()) return "Choose how you prefer to be contacted."
        return ""
      },
      showContactInfo: () => "",
      active: () => "",
    }),
    [categories]
  )

  const contactMethodOptions = useMemo(() => {
    if (!values.preferredContactMethod) {
      return DEFAULT_CONTACT_METHOD_OPTIONS
    }

    if (DEFAULT_CONTACT_METHOD_OPTIONS.includes(values.preferredContactMethod)) {
      return DEFAULT_CONTACT_METHOD_OPTIONS
    }

    return [...DEFAULT_CONTACT_METHOD_OPTIONS, values.preferredContactMethod]
  }, [values.preferredContactMethod])

  useEffect(() => {
    return () => {
      photos.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [photos])

  const runValidator = <Field extends keyof ListingFormValues>(field: Field, value: ListingFormValues[Field]) =>
    validators[field](value)

  const updateValue = <Field extends keyof ListingFormValues>(field: Field, value: ListingFormValues[Field]) => {
    setValues((prev) => {
      const updated = { ...prev, [field]: value }
      // Clear price when marking as free
      if (field === 'isFree' && value === true) {
        updated.price = '0'
      }
      return updated
    })
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: runValidator(field, value) }))
    }
  }

  const validateField = <Field extends keyof ListingFormValues>(field: Field) => {
    const error = runValidator(field, values[field])
    setErrors((prev) => ({ ...prev, [field]: error }))
    return error
  }

  const readFilesAsDataUrls = async (files: File[]): Promise<string[]> => {
    const readers = files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = () => reject(new Error('Failed to read file'))
          reader.readAsDataURL(file)
        })
    )
    return Promise.all(readers)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = (Object.keys(values) as Array<keyof ListingFormValues>).reduce<ListingFormErrors>(
      (acc, field) => {
        // Skip price validation if item is free
        if (field === 'price' && values.isFree) {
          return acc
        }
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
         if (values.showContactInfo) {
          if (!values.preferredContactMethod) {
            setSubmitError("Select a preferred contact method before displaying your contact info.")
            setIsSubmitting(false)
            return
          }
          if (values.preferredContactMethod === "Phone" && !user?.phoneNumber) {
            setSubmitError("You have enabled phone display but no phone number exists on your account. Update your profile first.")
            setIsSubmitting(false)
            return
          }
          if (values.preferredContactMethod === "Email" && !user?.email) {
            setSubmitError("You have enabled email display but no email exists on your account. Update your profile first.")
            setIsSubmitting(false)
            return
          }
        }

        const newImages = await readFilesAsDataUrls(photoFiles.slice(0, MAX_PHOTOS))
        const existingImages = photos
          .filter((photo) => photo.id.startsWith("existing-"))
          .map((photo) => photo.url)
        const allImages = [...existingImages, ...newImages]

        const payload = {
          title: values.title.trim(),
          description: values.description.trim(),
          price: values.price.trim(),
          isFree: values.isFree,
          isActive: values.active,
          status: (values.active ? 'active' : 'draft') as ListingStatus,
          categoryId: values.category,
          images: allImages,
          availability: values.availability.trim(),
          preferredContactMethod: values.preferredContactMethod.trim(),
          condition: values.condition,
          showContactInfo: values.showContactInfo,
        }

        let listing
        if (isEditMode && id) {
          listing = await updateListing(id, payload)
        } else {
          listing = await createListing(payload)
        }

        navigate("/listings/" + listing.id)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          navigate("/auth", {
            replace: true,
            state: {
              from: isEditMode ? `/listings/${id}/edit` : "/listings/new",
              message: "Please sign in to continue.",
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

    const filesArr = Array.from(files)

    void (async () => {
      const optimizedFiles = await Promise.all(
        filesArr.map(async (file) => {
          try {
            return await optimizeImage(file)
          } catch (error) {
            console.warn("Falling back to original image", error)
            return file
          }
        })
      )

      if (!isMountedRef.current) {
        return
      }

      setPhotoFiles((prev) => {
        const remainingSlots = Math.max(0, MAX_PHOTOS - prev.length)
        if (remainingSlots === 0) {
          return prev
        }

        const filesToAdd = optimizedFiles.slice(0, remainingSlots)
        return [...prev, ...filesToAdd]
      })

      setPhotos((prev) => {
        const remainingSlots = Math.max(0, MAX_PHOTOS - prev.length)
        if (remainingSlots === 0) {
          return prev
        }

        const filesToAdd = optimizedFiles.slice(0, remainingSlots)
        const newPreviews = filesToAdd.map<PhotoPreview>((file) => ({
          id: `${file.name}-${file.lastModified}-${
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : Math.random().toString(36).slice(2)
          }`,
          url: URL.createObjectURL(file),
          fileName: file.name,
        }))

        return [...prev, ...newPreviews]
      })
    })()
  }

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => {
      const removed = prev.find((preview) => preview.id === photoId)
      if (removed && !photoId.startsWith("existing-")) {
        URL.revokeObjectURL(removed.url)
      }
      return prev.filter((preview) => preview.id !== photoId)
    })
    if (!photoId.startsWith("existing-")) {
      setPhotoFiles((prev) => prev.filter((file) => !photoId.startsWith(file.name + '-' + file.lastModified)))
    }
  }

  if (isLoadingListing) {
    return (
      <section className="mx-auto flex max-w-4xl flex-col items-center justify-center px-4 py-24 text-slate-500">
        Loading listing...
      </section>
    )
  }

  if (loadListingError) {
    return (
      <section className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 px-4 py-24">
        <p className="text-red-600">{loadListingError}</p>
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          Back to Profile
        </button>
      </section>
    )
  }

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-primary">
          {isEditMode ? "Edit Listing" : "Create a Listing"}
        </h1>
        <p className="text-base text-slate-600">
          {isEditMode
            ? "Update the details of your listing."
            : "Share the details of what you're offering so buyers know exactly what to expect."}
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
          <ConditionSelector
            value={values.condition}
            onChange={(nextValue) => updateValue("condition", nextValue)}
            error={errors.condition}
            description="Choose the tag that best matches your item."
          />
        </section>

        <section className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Pricing &amp; discovery</h2>
            <p className="text-sm text-slate-500">Help buyers understand the cost and how to find your listing.</p>
          </div>
          <ToggleSwitch
            label="Free item (Give away)"
            name="isFree"
            description="Mark this item as free to encourage reuse and sustainability"
            hint="Free items are highlighted with a special badge"
            checked={values.isFree}
            onChange={(checked) => updateValue("isFree", checked)}
          />
          <PriceInput
            label="Price"
            name="price"
            placeholder="0.00"
            value={values.price}
            onChange={(value) => updateValue("price", value)}
            onBlur={() => validateField("price")}
            error={errors.price}
            required={!values.isFree}
            disabled={values.isFree}
          />
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span>
              Category<span className="ml-1 text-red-500">*</span>
            </span>
            <select
              name="category"
              value={values.category}
              onChange={(event) => updateValue("category", event.target.value)}
              onBlur={() => validateField("category")}
              className="rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              aria-invalid={Boolean(errors.category)}
              disabled={categoriesStatus !== "success" || categories.length === 0}
              required
            >
              <option value="" disabled>
                {categoriesStatus === "loading"
                  ? "Loading categories..."
                  : "Select a category"}
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
                Categories are temporarily unavailable. Please refresh the page and try again.
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
              Preferred contact method<span className="ml-1 text-red-500">*</span>
            </span>
            <select
              name="preferredContactMethod"
              value={values.preferredContactMethod}
              onChange={(event) => updateValue("preferredContactMethod", event.target.value)}
              onBlur={() => validateField("preferredContactMethod")}
              className="rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-invalid={Boolean(errors.preferredContactMethod)}
            >
              <option value="" disabled>
                Select a contact method
              </option>
              {contactMethodOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.preferredContactMethod ? (
              <span className="text-xs font-normal text-red-600">{errors.preferredContactMethod}</span>
            ) : null}
          </label>

           <ToggleSwitch
            label="Display contact info on this listing"
            name="showContactInfo"
            description="When enabled, buyers will see your preferred contact method (email, phone or in-app)."
            hint={values.showContactInfo ? "Your contact info will be shown to interested buyers. Use with care!" : "Your contact info will remain private."}
            checked={values.showContactInfo}
            onChange={(checked) => updateValue("showContactInfo", checked)}
          />

          {/* Warn when seller enables display but no contact info exists */}
          {values.showContactInfo && values.preferredContactMethod === "Phone" && !user?.phoneNumber ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              You don't have a phone number on your account. Update your profile to display a phone number.
            </div>
          ) : null}

          <ToggleSwitch
            label="Active listing"
            name="active"
            description="Disable this to create the listing as a draft to edit later."
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
            {isSubmitting ? (isEditMode ? "Updating…" : "Creating…") : (isEditMode ? "Update listing" : "Create listing")}
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
