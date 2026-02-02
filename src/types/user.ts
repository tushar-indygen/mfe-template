export interface UserModel {
  id: string
  name: string
  email: string
  role?: string

  username?: string
  first_name?: string
  last_name?: string
  realm_access?: {
    roles: string[]
  }
  tenant_id?: string
}
