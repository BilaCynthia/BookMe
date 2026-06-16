import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
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
