export type AuthUser = {
  id: string
  email: string
  name: string
  isVerified: boolean
}

export type AuthResponse = {
  user: AuthUser
  token: string
}

export type AuthCredentials = {
  email: string
  password: string
}

export type RegisterPayload = AuthCredentials & {
  name: string
}

export type RegisterResponse = {
  message: string
}

export type VerifyEmailPayload = {
  email: string
  code: string
}
