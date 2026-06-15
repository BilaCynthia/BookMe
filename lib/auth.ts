import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

// Create a customized Prisma instance for the adapter so it uses the 'Vendor' model
// instead of looking for 'User'.
const customPrismaForAdapter = {
  ...prisma,
  user: prisma.vendor,
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(customPrismaForAdapter as any),
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const vendor = await prisma.vendor.findUnique({
          where: { email: credentials.email as string },
        })

        if (!vendor || !vendor.passwordHash) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          vendor.passwordHash
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: vendor.id,
          email: vendor.email,
          name: vendor.name,
          profileCompleted: vendor.profileComplete,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false

        const existingVendor = await prisma.vendor.findUnique({
          where: { email: user.email },
          include: { accounts: true },
        })

        if (existingVendor) {
          const isLinked = existingVendor.accounts.some(
            (acc) => acc.provider === "google"
          )
          if (!isLinked) {
            await prisma.account.create({
              data: {
                userId: existingVendor.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token as string,
                expires_at: account.expires_at as number,
                token_type: account.token_type as string,
                scope: account.scope as string,
                id_token: account.id_token as string,
              },
            })
          }
        } else {
          await prisma.vendor.create({
            data: {
              email: user.email,
              name: user.name,
              profileComplete: false,
              accounts: {
                create: {
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token as string,
                  expires_at: account.expires_at as number,
                  token_type: account.token_type as string,
                  scope: account.scope as string,
                  id_token: account.id_token as string,
                },
              },
            },
          })
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      
      if (token.id) {
        const vendor = await prisma.vendor.findUnique({
          where: { id: token.id as string },
          select: { profileComplete: true, name: true },
        })
        if (vendor) {
          token.profileCompleted = vendor.profileComplete
          token.businessName = vendor.name
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.profileCompleted = token.profileCompleted as boolean
        session.user.businessName = token.businessName as string | null
      }
      return session
    },
  },
})
