import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string
      email?: string
      avatar?: string | null
      phone?: string | null
      address?: string | null
      usertype?: string | null
      is_prime?: boolean
      email_notification?: boolean
      is_verified?: boolean
      created_at?: Date | null
      updated_at?: Date | null
      // Profile data
      display_name?: string | null
      bio?: string | null
      locale?: string | null
      timezone?: string | null
      social?: Record<string, unknown> | null
      metadata?: Record<string, unknown> | null
      // Settings data
      preferences?: Record<string, unknown> | null
      push_notifications?: boolean
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    usertype?: string | null
    is_prime?: boolean
    email_notification?: boolean
    is_verified?: boolean
    created_at?: Date | null
    updated_at?: Date | null
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId?: string
    provider?: string
  }
}
