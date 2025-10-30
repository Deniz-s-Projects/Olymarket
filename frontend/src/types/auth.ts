export type AuthUser = {
  id: number
  email: string
  name: string
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
