import type { ListingsFilters } from '../hooks/useListings'

type SortBy = NonNullable<ListingsFilters['sortBy']>
type SortOrder = NonNullable<ListingsFilters['sortOrder']>

type SortOption = {
  id: string
  label: string
  description: string
  sortBy: SortBy
  sortOrder: SortOrder
}

const SORT_OPTIONS: SortOption[] = [
  {
    id: 'createdAt-desc',
    label: 'Newest first',
    description: 'the newest arrivals',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  {
    id: 'createdAt-asc',
    label: 'Oldest first',
    description: 'the oldest listings',
    sortBy: 'createdAt',
    sortOrder: 'asc',
  },
  {
    id: 'price-asc',
    label: 'Price: Low to High',
    description: 'price (low to high)',
    sortBy: 'price',
    sortOrder: 'asc',
  },
  {
    id: 'price-desc',
    label: 'Price: High to Low',
    description: 'price (high to low)',
    sortBy: 'price',
    sortOrder: 'desc',
  },
]

const getSortOptionSummary = (sortBy: SortBy, sortOrder: SortOrder): SortOption => {
  return SORT_OPTIONS.find((option) => option.sortBy === sortBy && option.sortOrder === sortOrder) ?? SORT_OPTIONS[0]
}

const getSortOptionId = (sortBy: SortBy, sortOrder: SortOrder): string => {
  const option = SORT_OPTIONS.find((candidate) => candidate.sortBy === sortBy && candidate.sortOrder === sortOrder)
  return option?.id ?? SORT_OPTIONS[0].id
}

export { SORT_OPTIONS, getSortOptionId, getSortOptionSummary }
export type { SortBy, SortOrder, SortOption }
