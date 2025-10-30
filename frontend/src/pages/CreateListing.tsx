import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import PhotoUploadField, {
  type PhotoPreview,
} from "../components/forms/PhotoUploadField"
import { ApiError } from "../lib/apiClient"
import { useAuth } from "../context/useAuth"
import {
  createListing,
  fetchListingCategories,
  type ListingCategory,
} from "../services/listings"
import ListingDetailsForm from "../components/listings/ListingDetailsForm"
import {
  createListingValidators,
  validateListingField,
  validateListingValues,
  type ListingFormErrors,
  type ListingFormValues,
} from "../lib/listingForm"
import { CONTACT_OPTIONS } from "../constants/listings"

const INITIAL_VALUES: ListingFormValues = {
  title: "",
  description: "",
  price: "",
  category: "",
  availability: "",
  contactPreference: "",
  active: true,
  moderationStatus: undefined,
  moderationNotes: "",
}

const MAX_PHOTOS = 6

const CreateListing = () => {
  const navigate = useNavigate()
  const { token } = useAuth()
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

  const validators = useMemo(() => createListingValidators(categories), [categories])

  useEffect(() => {
    return () => {
      photos.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [photos])

  const updateValue = <Field extends keyof ListingFormValues>(field: Field, value: ListingFormValues[Field]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: validateListingField(field, value, { ...values, [field]: value }, validators),
      }))
    }
  }

  const validateField = <Field extends keyof ListingFormValues>(field: Field) => {
    const error = validators[field](values)
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
    const nextErrors = validateListingValues(values, validators)
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
        const images = await readFilesAsDataUrls(photoFiles.slice(0, MAX_PHOTOS))
        const listing = await createListing({
          title: values.title.trim(),
          description: values.description.trim(),
          price: values.price.trim(),
          isActive: values.active,
          categoryId: values.category || undefined,
          images,
        })

        navigate("/listings/" + listing.id)
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

    const filesArr = Array.from(files)
    setPhotoFiles((prev) => [...prev, ...filesArr].slice(0, MAX_PHOTOS))

    setPhotos((prev) => {
      const newPreviews = filesArr.map<PhotoPreview>((file) => ({
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
    setPhotoFiles((prev) => prev.filter((file) => !id.startsWith(file.name + '-' + file.lastModified)))
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
        <ListingDetailsForm
          values={values}
          errors={errors}
          categories={categories}
          categoriesStatus={categoriesStatus}
          categoriesError={categoriesError}
          onRetryCategories={loadCategories}
          onChange={updateValue}
          onBlur={validateField}
          contactOptions={CONTACT_OPTIONS}
        />

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
