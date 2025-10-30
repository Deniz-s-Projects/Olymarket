import { CONTACT_OPTIONS } from "../constants/listings"
import type { ListingCategory } from "../services/listings"
import type { ModerationStatus } from "../services/admin"

export type ListingFormValues = {
  title: string
  description: string
  price: string
  category: string
  availability: string
  contactPreference: string
  active: boolean
  moderationStatus?: ModerationStatus
  moderationNotes?: string
}

export type ListingFormErrors = Partial<Record<keyof ListingFormValues, string>>

export type ListingValidatorMap = {
  [Field in keyof ListingFormValues]: (values: ListingFormValues) => string
}

type ValidatorOptions = {
  includeModeration?: boolean
  requireContactPreference?: boolean
}

export const createListingValidators = (
  categories: ListingCategory[],
  options: ValidatorOptions = {},
): ListingValidatorMap => {
  const contactPreferenceRequired = options.requireContactPreference ?? true

  return {
    title: (values) => {
      const value = values.title
      if (!value.trim()) return "A title is required."
      if (value.trim().length < 5) return "Titles should be at least 5 characters long."
      return ""
    },
    description: (values) => {
      const value = values.description
      if (!value.trim()) return "Describe your listing so buyers know what to expect."
      if (value.trim().length < 20)
        return "Please provide a bit more detail (minimum 20 characters)."
      return ""
    },
    price: (values) => {
      const rawValue = values.price
      if (!rawValue.trim()) return "Set a price for the listing."
      const numeric = Number(rawValue)
      if (Number.isNaN(numeric) || numeric <= 0) return "Price must be a positive number."
      return ""
    },
    category: (values) => {
      const value = values.category
      if (!value) return ""
      const exists = categories.some((category) => category.id === value)
      return exists ? "" : "Select a valid category."
    },
    availability: (values) => {
      const value = values.availability
      if (!value.trim()) return "Let buyers know when this listing is available."
      return ""
    },
    contactPreference: (values) => {
      const value = values.contactPreference
      if (!contactPreferenceRequired && !value) {
        return ""
      }
      if (!value) return "Choose how you prefer to be contacted."
      if (!CONTACT_OPTIONS.includes(value as (typeof CONTACT_OPTIONS)[number])) {
        return "Choose a valid contact option."
      }
      return ""
    },
    active: () => "",
    moderationStatus: (values) => {
      if (!options.includeModeration) {
        return ""
      }
      const value = values.moderationStatus
      if (!value) {
        return "Select a moderation status."
      }
      return ""
    },
    moderationNotes: (values) => {
      if (!options.includeModeration) {
        return ""
      }
      const status = values.moderationStatus
      const notes = values.moderationNotes ?? ""
      if (status === "rejected" && !notes.trim()) {
        return "Provide a reason when rejecting a listing."
      }
      return ""
    },
  }
}

export const validateListingField = <Field extends keyof ListingFormValues>(
  field: Field,
  value: ListingFormValues[Field],
  values: ListingFormValues,
  validators: ListingValidatorMap,
) => {
  const nextValues = { ...values, [field]: value }
  return validators[field](nextValues)
}

export const validateListingValues = (
  values: ListingFormValues,
  validators: ListingValidatorMap,
): ListingFormErrors => {
  return (Object.keys(values) as Array<keyof ListingFormValues>).reduce<ListingFormErrors>((acc, field) => {
    const error = validators[field](values)
    if (error) {
      acc[field] = error
    }
    return acc
  }, {})
}
