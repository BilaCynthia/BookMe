import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      profileCompleted: boolean
      businessName: string | null
    } & DefaultSession["user"]
  }
}
