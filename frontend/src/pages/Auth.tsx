import { type FormEvent, useMemo, useState } from "react"
import { useNavigate } from 'react-router-dom';
import { useFormValidation } from "../hooks/useFormValidation"
import { useAuth } from "../context/useAuth"
import { login as loginRequest, register as registerRequest } from "../services/auth"
import { type AuthServiceError } from "../services/auth"

type ActiveForm = "login" | "register"

const emailValidator = (value: string) => {
  const trimmed = value.trim()
  const helper = "We'll use this email to send you marketplace updates."

  if (!trimmed) {
    return {
      error: "Email is required.",
      helper: "Enter the email address you want associated with this account.",
    }
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(trimmed)) {
    return {
      error: "Enter a valid email address.",
      helper: "Example: alex@example.com",
    }
  }

  return { helper }
}

const fullNameValidator = (value: string) => {
  const trimmed = value.trim()
  const helper = "This is how your name will appear to buyers and sellers."

  if (!trimmed) {
    return {
      error: "Your name is required.",
      helper: "Share at least your first and last name for account setup.",
    }
  }

  if (trimmed.length < 2) {
    return {
      error: "Name is too short.",
      helper: "Use at least two characters so we know how to address you.",
    }
  }

  return { helper }
}

const getPasswordStrength = (value: string) => {
  const score = [
    value.length >= 8,
    value.length >= 12,
    /[A-Z]/.test(value),
    /[0-9]/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length

  if (!value) {
    return { label: "None", suggestions: "Use at least 8 characters." }
  }

  const suggestions: string[] = []
  if (!/[A-Z]/.test(value)) suggestions.push("add an uppercase letter")
  if (!/[0-9]/.test(value)) suggestions.push("include a number")
  if (!/[^A-Za-z0-9]/.test(value)) suggestions.push("try a special character")

  const label = score >= 5 ? "Strong" : score >= 3 ? "Medium" : "Weak"

  const suggestionMessage =
    suggestions.length > 0
      ? `To strengthen it, ${suggestions.join(", ")}.`
      : "Looking great!"

  return { label, suggestions: suggestionMessage }
}

const passwordValidator = (value: string) => {
  const { label, suggestions } = getPasswordStrength(value)

  if (!value) {
    return {
      error: "Password is required.",
      helper: "Create a password with at least 8 characters, including numbers.",
    }
  }

  if (value.length < 8) {
    return {
      error: "Use at least 8 characters.",
      helper: `Strength: ${label}. ${suggestions}`,
    }
  }

  return {
    helper: `Strength: ${label}. ${suggestions}`,
  }
}

const confirmPasswordValidator = (value: string, values: { password: string }) => {
  if (!value) {
    return {
      error: "Confirm your password.",
      helper: "Enter the same password again to confirm it.",
    }
  }

  if (value !== values.password) {
    return {
      error: "Passwords do not match.",
      helper: "Make sure both passwords are identical.",
    }
  }

  return {
    helper: "Great! Both passwords match.",
  }
}

const Auth = () => {
  const [activeForm, setActiveForm] = useState<ActiveForm>("login")
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] =
    useState(false)
  const { login: setAuth, banNotice } = useAuth()

  const loginForm = useFormValidation(
    { email: "", password: "" },
    useMemo(
      () => ({
        email: (value) => emailValidator(value),
        password: (value) => passwordValidator(value),
      }),
      []
    )
  )

  const registerForm = useFormValidation(
    { fullName: "", email: "", password: "", confirmPassword: "" },
    useMemo(
      () => ({
        fullName: (value) => fullNameValidator(value),
        email: (value) => emailValidator(value),
        password: (value) => passwordValidator(value),
        confirmPassword: (value, values) =>
          confirmPasswordValidator(value, {
            password: values.password,
          }),
      }),
      []
    )
  )

  const displayMessage = (
    form: typeof loginForm,
    fallback: string
  ): { text: string; tone: "neutral" | "success" | "error" | "muted" } => {
    if (form.status === "error" && form.feedback) {
      return { text: form.feedback, tone: "error" }
    }

    if (form.status === "success" && form.feedback) {
      return { text: form.feedback, tone: "success" }
    }

    if (form.status === "loading" && form.feedback) {
      return { text: form.feedback, tone: "neutral" }
    }

    return { text: fallback, tone: "muted" }
  }
  
  const navigate = useNavigate();
  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault() 
    if (!loginForm.validateForm()) {
      loginForm.setStatus(
        "error",
        "Please address the highlighted fields before continuing."
      )
      return
    }

    loginForm.setStatus("loading", "Signing you in...")

    try {
      const response = await loginRequest({
        email: loginEmailField.value,
        password: loginPasswordField.value,
      })

      setAuth(response)
      loginForm.setStatus("success", "Welcome back! Redirecting you shortly.")
      navigate('/profile'); // Redirect to homepage after successful login
    } catch (error) {
      const authError = error as AuthServiceError
      const isBannedError =
        authError.code === "USER_BANNED" ||
        Boolean(authError.details?.["isBanned"])

      if (isBannedError) {
        const banReason =
          typeof authError.details?.["banReason"] === "string"
            ? (authError.details?.["banReason"] as string)
            : undefined
        loginForm.setStatus(
          "error",
          banReason
            ? `Access denied: ${banReason}`
            : authError.message ||
                "Your account has been suspended. Please contact support."
        )
      } else if (authError.status === 401) {
        loginForm.setStatus(
          "error",
          "We couldn't verify those credentials. Please try again."
        )
      } else {
        loginForm.setStatus(
          "error",
          authError.message ||
            "Something went wrong while signing you in. Please try again later."
        )
      }
    }
  }

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!registerForm.validateForm()) {
      registerForm.setStatus(
        "error",
        "Make sure all fields are complete before creating your account."
      )
      return
    }

    registerForm.setStatus("loading", "Creating your account...")

    try {
      const response = await registerRequest({
        name: registerNameField.value,
        email: registerEmailField.value,
        password: registerPasswordField.value,
      })

      setAuth(response)
      registerForm.setStatus("success", "Account created! You're all set.")
    } catch (error) {
      const authError = error as AuthServiceError
      if (authError.status === 409) {
        registerForm.setStatus(
          "error",
          "An account with this email already exists. Try signing in instead."
        )
      } else {
        registerForm.setStatus(
          "error",
          "We ran into a problem creating your account. Please try again later."
        )
      }
    }
  }

  const renderHelperText = (
    field: ReturnType<typeof loginForm.getFieldState>,
    fallback: string
  ) => {
    if (field.isTouched && field.error) {
      return <p className="text-xs text-red-600">{field.error}</p>
    }

    if (field.helper) {
      return <p className="text-xs text-slate-500">{field.helper}</p>
    }

    return <p className="text-xs text-slate-400">{fallback}</p>
  }

  const renderPasswordToggle = (isVisible: boolean, onToggle: () => void) => (
    <button
      type="button"
      onClick={onToggle}
      className="text-sm font-medium text-primary transition hover:text-primary/80"
    >
      {isVisible ? "Hide" : "Show"}
    </button>
  )

  const loginEmailField = loginForm.getFieldState("email")
  const loginPasswordField = loginForm.getFieldState("password")
  const registerNameField = registerForm.getFieldState("fullName")
  const registerEmailField = registerForm.getFieldState("email")
  const registerPasswordField = registerForm.getFieldState("password")
  const registerConfirmPasswordField = registerForm.getFieldState("confirmPassword")

  const loginMessage = displayMessage(
    loginForm,
    "Sign in to access your personalized marketplace experience."
  )
  const registerMessage = displayMessage(
    registerForm,
    "Create an account to start buying and selling on Olymarket."
  )

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-primary">
          Sign in or Create an Account
        </h1>
        <p className="text-base text-slate-600">
          Manage your marketplace profile with intuitive forms that are ready for
          API integration when you are.
        </p>
      </header>

      {banNotice ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Account access restricted</p>
          <p className="mt-1">
            {banNotice.reason
              ? `We can't sign you in because your account is suspended: ${banNotice.reason}`
              : "We can't sign you in because your account is currently suspended."}
          </p>
          {banNotice.appealUrl ? (
            <a
              href={banNotice.appealUrl}
              className="mt-2 inline-flex text-xs font-semibold text-amber-700 underline-offset-2 hover:underline"
            >
              Contact support to appeal
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center gap-2 rounded-full bg-slate-100 p-1 text-sm font-medium">
          {(["login", "register"] as ActiveForm[]).map((formKey) => (
            <button
              key={formKey}
              type="button"
              className={`w-1/2 rounded-full px-4 py-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                activeForm === formKey
                  ? "bg-white text-primary shadow"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => setActiveForm(formKey)}
            >
              {formKey === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <form
            className={activeForm === "login" ? "space-y-5" : "hidden"}
            onSubmit={handleLoginSubmit}
            noValidate
          >
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700" htmlFor="login-email">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                value={loginEmailField.value}
                onChange={loginForm.handleChange("email")}
                onBlur={() => loginForm.handleBlur("email")}
                className={`w-full rounded-lg border px-3 py-2 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  loginEmailField.isTouched && loginEmailField.error
                    ? "border-red-500"
                    : "border-slate-200"
                }`}
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={
                  loginEmailField.isTouched && Boolean(loginEmailField.error)
                }
              />
              {renderHelperText(
                loginEmailField,
                "Enter the email associated with your account."
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  className="text-sm font-semibold text-slate-700"
                  htmlFor="login-password"
                >
                  Password
                </label>
                {renderPasswordToggle(showLoginPassword, () =>
                  setShowLoginPassword((prev) => !prev)
                )}
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showLoginPassword ? "text" : "password"}
                  value={loginPasswordField.value}
                  onChange={loginForm.handleChange("password")}
                  onBlur={() => loginForm.handleBlur("password")}
                  className={`w-full rounded-lg border px-3 py-2 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    loginPasswordField.isTouched && loginPasswordField.error
                      ? "border-red-500"
                      : "border-slate-200"
                  }`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={
                    loginPasswordField.isTouched &&
                    Boolean(loginPasswordField.error)
                  }
                />
              </div>
              {renderHelperText(
                loginPasswordField,
                "Passwords are case-sensitive."
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <a
                href="#"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Forgot password?
              </a>
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-400"
              >
                SSO coming soon
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Continue
            </button>

            <p
              role="status"
              className={`text-xs ${
                loginMessage.tone === "error"
                  ? "text-red-600"
                  : loginMessage.tone === "success"
                    ? "text-green-600"
                    : loginMessage.tone === "neutral"
                      ? "text-slate-600"
                      : "text-slate-400"
              }`}
            >
              {loginMessage.text}
            </p>
          </form>

          <form
            className={activeForm === "register" ? "space-y-5" : "hidden"}
            onSubmit={handleRegisterSubmit}
            noValidate
          >
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700" htmlFor="register-name">
                Full name
              </label>
              <input
                id="register-name"
                type="text"
                value={registerNameField.value}
                onChange={registerForm.handleChange("fullName")}
                onBlur={() => registerForm.handleBlur("fullName")}
                className={`w-full rounded-lg border px-3 py-2 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  registerNameField.isTouched && registerNameField.error
                    ? "border-red-500"
                    : "border-slate-200"
                }`}
                placeholder="Alex Johnson"
                autoComplete="name"
                aria-invalid={
                  registerNameField.isTouched && Boolean(registerNameField.error)
                }
              />
              {renderHelperText(
                registerNameField,
                "Provide the name that will appear on invoices."
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700" htmlFor="register-email">
                Email address
              </label>
              <input
                id="register-email"
                type="email"
                value={registerEmailField.value}
                onChange={registerForm.handleChange("email")}
                onBlur={() => registerForm.handleBlur("email")}
                className={`w-full rounded-lg border px-3 py-2 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  registerEmailField.isTouched && registerEmailField.error
                    ? "border-red-500"
                    : "border-slate-200"
                }`}
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={
                  registerEmailField.isTouched &&
                  Boolean(registerEmailField.error)
                }
              />
              {renderHelperText(
                registerEmailField,
                "We'll use this email for confirmations and alerts."
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  className="text-sm font-semibold text-slate-700"
                  htmlFor="register-password"
                >
                  Password
                </label>
                {renderPasswordToggle(showRegisterPassword, () =>
                  setShowRegisterPassword((prev) => !prev)
                )}
              </div>
              <div className="relative">
                <input
                  id="register-password"
                  type={showRegisterPassword ? "text" : "password"}
                  value={registerPasswordField.value}
                  onChange={registerForm.handleChange("password")}
                  onBlur={() => registerForm.handleBlur("password")}
                  className={`w-full rounded-lg border px-3 py-2 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    registerPasswordField.isTouched && registerPasswordField.error
                      ? "border-red-500"
                      : "border-slate-200"
                  }`}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  aria-invalid={
                    registerPasswordField.isTouched &&
                    Boolean(registerPasswordField.error)
                  }
                />
              </div>
              {renderHelperText(
                registerPasswordField,
                "Use at least 8 characters with a mix of letters and numbers."
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  className="text-sm font-semibold text-slate-700"
                  htmlFor="register-confirm-password"
                >
                  Confirm password
                </label>
                {renderPasswordToggle(showRegisterConfirmPassword, () =>
                  setShowRegisterConfirmPassword((prev) => !prev)
                )}
              </div>
              <div className="relative">
                <input
                  id="register-confirm-password"
                  type={showRegisterConfirmPassword ? "text" : "password"}
                  value={registerConfirmPasswordField.value}
                  onChange={registerForm.handleChange("confirmPassword")}
                  onBlur={() => registerForm.handleBlur("confirmPassword")}
                  className={`w-full rounded-lg border px-3 py-2 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    registerConfirmPasswordField.isTouched &&
                    registerConfirmPasswordField.error
                      ? "border-red-500"
                      : "border-slate-200"
                  }`}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  aria-invalid={
                    registerConfirmPasswordField.isTouched &&
                    Boolean(registerConfirmPasswordField.error)
                  }
                />
              </div>
              {renderHelperText(
                registerConfirmPasswordField,
                "Re-enter your password to confirm it."
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <a
                href="#"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Need help signing up?
              </a>
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-400"
              >
                SSO coming soon
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Create account
            </button>

            <p
              role="status"
              className={`text-xs ${
                registerMessage.tone === "error"
                  ? "text-red-600"
                  : registerMessage.tone === "success"
                    ? "text-green-600"
                    : registerMessage.tone === "neutral"
                      ? "text-slate-600"
                      : "text-slate-400"
              }`}
            >
              {registerMessage.text}
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}

export default Auth
