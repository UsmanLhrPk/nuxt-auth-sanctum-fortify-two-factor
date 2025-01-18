export interface User {
  id: number
  name: string
  email: string
  email_verified_at: Date
  two_factor_confirmed_at?: Date
  created_at: Date
  updated_at: Date
}
