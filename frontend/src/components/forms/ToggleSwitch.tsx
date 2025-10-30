import type { ButtonHTMLAttributes } from "react"

export interface ToggleSwitchProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "onChange" | "type"> {
  label: string
  name: string
  checked: boolean
  onChange: (checked: boolean) => void
  description?: string
  hint?: string
}

const ToggleSwitch = ({
  label,
  name,
  checked,
  onChange,
  description,
  hint,
  disabled,
  ...rest
}: ToggleSwitchProps) => {
  return (
    <div className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col">
          <span>{label}</span>
          {description ? (
            <span className="text-xs font-normal text-slate-500">{description}</span>
          ) : null}
        </div>
        <button
          {...rest}
          id={name}
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          disabled={disabled}
          className={`relative flex h-6 w-11 items-center rounded-full border transition focus:outline-none focus:ring-2 focus:ring-primary/20 ${
            checked ? "border-primary bg-primary" : "border-slate-300 bg-slate-200"
          } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        >
          <span
            className={`inline-block h-5 w-5 translate-x-0 transform rounded-full bg-white shadow transition ${
              checked ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      {hint ? <span className="text-xs font-normal text-slate-500">{hint}</span> : null}
    </div>
  )
}

export default ToggleSwitch
