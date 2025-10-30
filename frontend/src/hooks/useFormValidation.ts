import { type ChangeEvent, useCallback, useMemo, useState } from "react"

type ValidatorResult = {
  error?: string
  helper?: string
}

type Validators<T> = Partial<{
  [K in keyof T]: (value: T[K], values: T) => ValidatorResult
}>

export type FormStatus = "idle" | "loading" | "success" | "error"

type FieldState<Value> = {
  value: Value
  error?: string
  helper?: string
  isValid: boolean
  isTouched: boolean
}

type Touched<T> = Partial<Record<keyof T, boolean>>

export const useFormValidation = <T extends Record<string, string>>(
  initialValues: T,
  validators: Validators<T>
) => {
  const [values, setValues] = useState<T>(initialValues)
  const [touched, setTouched] = useState<Touched<T>>({})
  const [status, internalSetStatus] = useState<FormStatus>("idle")
  const [feedback, setFeedback] = useState<string>("")

  const fieldStates = useMemo(() => {
    const states = {} as Record<keyof T, FieldState<T[keyof T]>>

    ;(Object.keys(values) as Array<keyof T>).forEach((field) => {
      const validator = validators[field]
      const result = validator?.(values[field], values) ?? {}

      states[field] = {
        value: values[field],
        error: result.error,
        helper: result.helper,
        isValid: !result.error,
        isTouched: Boolean(touched[field]),
      }
    })

    return states
  }, [touched, validators, values])

  const setFieldValue = useCallback((field: keyof T, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleChange = useCallback(
    (field: keyof T) =>
      (event: ChangeEvent<HTMLInputElement>) => {
        setFieldValue(field, event.target.value)
      },
    [setFieldValue]
  )

  const handleBlur = useCallback((field: keyof T) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }, [])

  const setStatus = useCallback((nextStatus: FormStatus, message = "") => {
    internalSetStatus(nextStatus)
    setFeedback(message)
  }, [])

  const validateForm = useCallback(() => {
    const allTouched = {} as Touched<T>
    ;(Object.keys(values) as Array<keyof T>).forEach((field) => {
      allTouched[field] = true
    })
    setTouched(allTouched)

    return (Object.values(fieldStates) as Array<FieldState<string>>).every(
      (field) => field.isValid
    )
  }, [fieldStates, values])

  const reset = useCallback(() => {
    setValues(initialValues)
    setTouched({})
    internalSetStatus("idle")
    setFeedback("")
  }, [initialValues])

  const getFieldState = useCallback(
    (field: keyof T): FieldState<T[keyof T]> => {
      return fieldStates[field]
    },
    [fieldStates]
  )

  return {
    values,
    status,
    feedback,
    fieldStates,
    getFieldState,
    setFieldValue,
    handleChange,
    handleBlur,
    validateForm,
    setStatus,
    reset,
  }
}

export type UseFormValidationReturn<T extends Record<string, string>> = ReturnType<
  typeof useFormValidation<T>
>
