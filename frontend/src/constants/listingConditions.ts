import type { ListingCondition } from '../services/listings'

export type ListingConditionOption = {
  value: ListingCondition
  label: string
  description: string
  icon: string
}

export const DEFAULT_LISTING_CONDITION: ListingCondition = 'used_but_works'

export const LISTING_CONDITION_CONFIG: Record<ListingCondition, ListingConditionOption> = {
  new: {
    value: 'new',
    label: 'New',
    description: 'Unopened or unused — straight out of the box.',
    icon: '✨',
  },
  good: {
    value: 'good',
    label: 'Good',
    description: 'Gently used with light wear and fully functional.',
    icon: '👍',
  },
  used_but_works: {
    value: 'used_but_works',
    label: 'Used but works',
    description: 'Shows regular wear but works reliably.',
    icon: '🔧',
  },
  fixer_upper: {
    value: 'fixer_upper',
    label: 'Fixer-upper',
    description: 'Needs some love or repairs to shine again.',
    icon: '🛠️',
  },
}

export const LISTING_CONDITION_OPTIONS: ListingConditionOption[] = Object.values(LISTING_CONDITION_CONFIG)
