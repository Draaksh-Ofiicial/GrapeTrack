import NextAuth, { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"
import { updateUserLoginInfo, recordLoginAttempt, getUserLoginStats } from "./auth-utils"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow any Google account to sign in for demo purposes
      if (account?.provider === "google") {
        try {
          // For new users, the user ID might not be available yet
          // We'll handle the login tracking in the signIn event instead
          return true
        } catch (error) {
          console.error('Error in signIn callback:', error)
          return false
        }
      }
      return true
    },
    async session({ session, token, user }) {
      // Add user info to session
      if (session?.user && user) {
        session.user.id = user.id
        
        // Fetch additional user info including login stats
        try {
          const userStats = await getUserLoginStats(user.id)
          if (userStats?.user) {
            session.user = {
              ...session.user,
              ...userStats.user
            }
          }
        } catch (error) {
          console.error('Error fetching user stats in session callback:', error)
          // Don't fail the session if we can't get stats
        }
      }
      return session
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.provider = account.provider
      }
      if (user) {
        token.userId = user.id
      }
      return token
    }
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Record login attempt and update user stats
      if (user.id && account) {
        try {
          // Update user login info
          await updateUserLoginInfo(user.id)
          
          // Record login attempt
          await recordLoginAttempt({
            userId: user.id,
            provider: account.provider,
            success: true,
            // Note: IP and user agent would be available in a server context
            ipAddress: undefined,
            userAgent: undefined,
          })
          
          console.log(`User ${user.email} signed in with ${account.provider}`)
          
          if (isNewUser) {
            console.log(`New user created: ${user.email}`)
            // You can add additional setup for new users here
          }
        } catch (error) {
          console.error('Error recording login:', error)
        }
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
