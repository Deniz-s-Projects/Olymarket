import type { FC } from 'react'
import { LISTING_CONDITION_OPTIONS } from '../../constants/listingConditions'
import type { ListingCondition } from '../../services/listings'

export type ConditionSelectorProps = {
  name?: string
  label?: string
  description?: string
  value: ListingCondition
  onChange: (value: ListingCondition) => void
  error?: string
}

const ConditionSelector: FC<ConditionSelectorProps> = ({
  name = 'condition',
  label = 'Condition',
  description = 'Give buyers a quick sense of what to expect.',
  value,
  onChange,
  error,
}) => {
  return (
    <fieldset className="flex flex-col gap-2" aria-invalid={Boolean(error)}>
      <legend className="text-sm font-medium text-slate-700">{label}</legend>
      {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={label}>
        {LISTING_CONDITION_OPTIONS.map((option) => {
          const isActive = option.value === value
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                isActive
                  ? 'border-primary bg-primary/10 text-primary shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:bg-primary/5'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isActive}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span className="mt-0.5 text-xl" aria-hidden="true">
                {option.icon}
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-sm font-semibold">{option.label}</span>
                <span className="text-xs text-slate-500">{option.description}</span>
              </span>
            </label>
          )
        })}
      </div>
      {error ? <span className="text-xs font-normal text-red-600">{error}</span> : null}
    </fieldset>
  )
}

export default ConditionSelector
