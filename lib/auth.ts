import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

// Create a customized Prisma instance for the adapter so it uses the 'Vendor' model
// instead of looking for 'User'.
const customPrismaForAdapter = new Proxy(prisma, {
  get(target, prop) {
    if (prop === "user") {
      return target.vendor
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (target as any)[prop]
    return typeof value === "function" ? value.bind(target) : value
  },
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
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
        console.log("AUTHORIZE START", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log("AUTHORIZE FAILED: Missing credentials");
          return null
        }

        const email = (credentials.email as string).toLowerCase().trim()
        console.log("AUTHORIZE: Searching for email", email);
        const vendor = await prisma.vendor.findUnique({
          where: { email },
        })

        if (!vendor) {
          console.log("AUTHORIZE FAILED: Vendor not found");
          return null
        }
        
        if (!vendor.passwordHash) {
          console.log("AUTHORIZE FAILED: Vendor has no passwordHash");
          return null
        }

        console.log("AUTHORIZE: Comparing passwords");
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          vendor.passwordHash
        )

        if (!isPasswordValid) {
          console.log("AUTHORIZE FAILED: Invalid password");
          return null
        }

        console.log("AUTHORIZE SUCCESS: Returning vendor", vendor.id);
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
    async jwt({ token, user, trigger, session }) {
      // The 'user' object is ONLY passed in the very first time the JWT is created (on sign-in).
      // We query the database here to populate the token.
      if (user) {
        token.id = user.id
        
        // Fetch additional vendor details to store in the stateless JWT
        const vendor = await prisma.vendor.findUnique({
          where: { id: user.id as string },
          select: { profileComplete: true, name: true },
        })
        if (vendor) {
          token.profileCompleted = vendor.profileComplete
          token.businessName = vendor.name
        }
      }

      // If we manually call update() on the session, update the token
      if (trigger === "update" && session) {
        if (session.profileCompleted !== undefined) {
          token.profileCompleted = session.profileCompleted
        }
        if (session.businessName !== undefined) {
          token.businessName = session.businessName
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
