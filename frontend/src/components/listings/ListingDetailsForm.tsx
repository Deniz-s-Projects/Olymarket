import TextInput from "../forms/TextInput"
import TextArea from "../forms/TextArea"
import PriceInput from "../forms/PriceInput"
import ToggleSwitch from "../forms/ToggleSwitch"
import { CONTACT_OPTIONS, MODERATION_STATUS_OPTIONS } from "../../constants/listings"
import type { ListingCategory } from "../../services/listings"
import type { ListingFormErrors, ListingFormValues } from "../../lib/listingForm"

type ListingDetailsFormProps = {
  values: ListingFormValues
  errors: ListingFormErrors
  categories: ListingCategory[]
  categoriesStatus: "idle" | "loading" | "success" | "error"
  categoriesError: string | null
  onRetryCategories?: () => void
  onChange: <Field extends keyof ListingFormValues>(field: Field, value: ListingFormValues[Field]) => void
  onBlur: <Field extends keyof ListingFormValues>(field: Field) => void
  contactOptions?: readonly string[]
  includeModerationFields?: boolean
  moderationReadOnlyFields?: Partial<Record<keyof ListingFormValues, boolean>>
}

const ListingDetailsForm = ({
  values,
  errors,
  categories,
  categoriesStatus,
  categoriesError,
  onRetryCategories,
  onChange,
  onBlur,
  contactOptions = CONTACT_OPTIONS,
  includeModerationFields = false,
  moderationReadOnlyFields,
}: ListingDetailsFormProps) => {
  const isRetryVisible = categoriesStatus === "error" && Boolean(categoriesError)
  const isCategoriesEmpty = categoriesStatus === "success" && categories.length === 0

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Basic information</h2>
          <p className="text-sm text-slate-500">This information appears at the top of the listing.</p>
        </div>
        <TextInput
          label="Title"
          name="title"
          placeholder="e.g., Premium rowing machine rental"
          value={values.title}
          onChange={(value) => onChange("title", value)}
          onBlur={() => onBlur("title")}
          error={errors.title}
          required
        />
        <TextArea
          label="Description"
          name="description"
          placeholder="Describe the condition, what's included, and any other relevant details."
          value={values.description}
          onChange={(value) => onChange("description", value)}
          onBlur={() => onBlur("description")}
          error={errors.description}
          required
          rows={6}
        />
      </section>

      <section className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Pricing &amp; discovery</h2>
          <p className="text-sm text-slate-500">Help buyers understand the cost and how to find this listing.</p>
        </div>
        <PriceInput
          label="Price"
          name="price"
          placeholder="0.00"
          value={values.price}
          onChange={(value) => onChange("price", value)}
          onBlur={() => onBlur("price")}
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
            onChange={(event) => onChange("category", event.target.value)}
            onBlur={() => onBlur("category")}
            className="rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            aria-invalid={Boolean(errors.category)}
            disabled={categoriesStatus === "loading"}
          >
            <option value="">
              {categoriesStatus === "loading" ? "Loading categories..." : "No category"}
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
          {isRetryVisible ? (
            <div className="flex items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <span>{categoriesError}</span>
              {onRetryCategories ? (
                <button
                  type="button"
                  onClick={onRetryCategories}
                  className="rounded-full border border-amber-400 px-2 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                >
                  Retry
                </button>
              ) : null}
            </div>
          ) : null}
          {isCategoriesEmpty ? (
            <span className="text-xs font-normal text-slate-500">
              Categories aren't available yet. You can still manage the listing without one.
            </span>
          ) : null}
        </label>
      </section>

      <section className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Availability &amp; preferences</h2>
          <p className="text-sm text-slate-500">Let buyers know when the listing is available and the best way to reach the owner.</p>
        </div>
        <TextInput
          label="Availability details"
          name="availability"
          placeholder="e.g., Weekdays after 5pm"
          value={values.availability}
          onChange={(value) => onChange("availability", value)}
          onBlur={() => onBlur("availability")}
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
            onChange={(event) => onChange("contactPreference", event.target.value)}
            onBlur={() => onBlur("contactPreference")}
            className="rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-invalid={Boolean(errors.contactPreference)}
          >
            <option value="" disabled>
              Select a contact method
            </option>
            {contactOptions.map((option) => (
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
          onChange={(checked) => onChange("active", checked)}
        />
      </section>

      {includeModerationFields ? (
        <section className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Moderation</h2>
            <p className="text-sm text-slate-500">
              Update the moderation status and communicate any notes back to the listing owner.
            </p>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span>
              Status<span className="ml-1 text-red-500">*</span>
            </span>
            <select
              name="moderationStatus"
              value={values.moderationStatus ?? ""}
              onChange={(event) => onChange("moderationStatus", event.target.value as ListingFormValues["moderationStatus"])}
              onBlur={() => onBlur("moderationStatus")}
              className="rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-invalid={Boolean(errors.moderationStatus)}
              disabled={moderationReadOnlyFields?.moderationStatus}
            >
              <option value="" disabled>
                Select a status
              </option>
              {MODERATION_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
            {errors.moderationStatus ? (
              <span className="text-xs font-normal text-red-600">{errors.moderationStatus}</span>
            ) : null}
          </label>
          <TextArea
            label="Moderator notes"
            name="moderationNotes"
            placeholder="Share context with the listing owner."
            value={values.moderationNotes ?? ""}
            onChange={(value) => onChange("moderationNotes", value)}
            onBlur={() => onBlur("moderationNotes")}
            error={errors.moderationNotes}
            rows={4}
          />
        </section>
      ) : null}
    </div>
  )
}

export default ListingDetailsForm
