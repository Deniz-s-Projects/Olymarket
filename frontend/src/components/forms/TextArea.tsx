import type { TextareaHTMLAttributes } from "react"

export interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "onChange" | "value"> {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  description?: string
}

const TextArea = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  description,
  placeholder,
  rows = 4,
  required,
  ...rest
}: TextAreaProps) => {
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
      <textarea
        {...rest}
        id={name}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : description ? `${name}-description` : undefined}
      />
      {error ? (
        <span id={`${name}-error`} className="text-xs font-normal text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  )
}

export default TextArea
