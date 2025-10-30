import type { InputHTMLAttributes } from "react"

export interface PriceInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "onChange" | "value" | "type"> {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  currency?: string
  description?: string
}

const PriceInput = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  currency = "USD",
  description,
  placeholder,
  required,
  ...rest
}: PriceInputProps) => {
  const currencyLabel = currency.toUpperCase()

  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      <span>
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      {description ? (
        <span
          id={`${name}-description`}
          className="text-xs font-normal text-slate-500"
        >
          {description}
        </span>
      ) : null}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-semibold text-slate-500">
          {currencyLabel === "USD" ? "$" : currencyLabel}
        </span>
        <input
          {...rest}
          id={name}
          name={name}
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-md border border-slate-300 px-3 py-2 pl-9 text-base text-slate-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : description ? `${name}-description` : undefined}
        />
      </div>
      {error ? (
        <span id={`${name}-error`} className="text-xs font-normal text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  )
}

export default PriceInput
