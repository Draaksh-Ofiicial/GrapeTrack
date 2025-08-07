import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      lastLoginAt?: Date | null
      loginCount?: number
      createdAt?: Date
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    lastLoginAt?: Date | null
    loginCount?: number
    createdAt?: Date
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId?: string
    provider?: string
  }
}
