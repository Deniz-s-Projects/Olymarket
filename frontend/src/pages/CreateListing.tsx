import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import PriceInput from "../components/forms/PriceInput"
import TextArea from "../components/forms/TextArea"
import TextInput from "../components/forms/TextInput"
import ToggleSwitch from "../components/forms/ToggleSwitch"
import PhotoUploadField, {
  type PhotoPreview,
} from "../components/forms/PhotoUploadField"

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

const CATEGORIES = ["Equipment", "Services", "Facilities", "Tickets", "Training"]
const CONTACT_OPTIONS = ["Email", "Phone", "In-app messaging"]
const MAX_PHOTOS = 6

type ValidatorMap = {
  [Field in keyof ListingFormValues]: (value: ListingFormValues[Field]) => string
}

const CreateListing = () => {
  const [values, setValues] = useState<ListingFormValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<ListingFormErrors>({})
  const [photos, setPhotos] = useState<PhotoPreview[]>([])

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
        if (!value) return "Select a category to help shoppers discover this item."
        return ""
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
    []
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
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
      // In a future iteration this payload will be submitted to the API.
      // eslint-disable-next-line no-console
      console.log({ ...values, photos })
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
              Category<span className="ml-1 text-red-500">*</span>
            </span>
            <select
              name="category"
              value={values.category}
              onChange={(event) => updateValue("category", event.target.value)}
              onBlur={() => validateField("category")}
              className="rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-invalid={Boolean(errors.category)}
            >
              <option value="" disabled>
                Select a category
              </option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category ? (
              <span className="text-xs font-normal text-red-600">{errors.category}</span>
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

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Save draft
          </button>
        </div>
      </form>
    </section>
  )
}

export default CreateListing
