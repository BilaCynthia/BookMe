import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { KeyRound, ShieldAlert } from "lucide-react"

export const metadata = {
  title: "Settings - BookMe",
}

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const vendorId = session.user.id

  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
  })

  if (!vendor) redirect("/login")

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-4xl">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Settings</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
          <CardDescription>
            Manage your password and security settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Email Address</label>
            <Input defaultValue={vendor.email || ""} disabled />
            <p className="text-[10px] text-muted-foreground mt-1">
              Email changes are not permitted for security reasons. Contact support if you need to change your primary account email.
            </p>
          </div>

          {!vendor.passwordHash ? (
            <div className="rounded-md border p-4 bg-muted/20">
              <div className="flex items-center space-x-3">
                <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Google Authenticated</p>
                  <p className="text-sm text-muted-foreground">
                    You signed up using Google. You do not need a password.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-4 space-y-4 border-t">
              <h3 className="text-sm font-semibold">Change Password</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Current Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input type="password" placeholder="••••••••" className="pl-9" disabled />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">New Password</label>
                <Input type="password" placeholder="••••••••" disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Confirm New Password</label>
                <Input type="password" placeholder="••••••••" disabled />
              </div>
              <Button>Update Password</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible account actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:items-center">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently remove your account and all associated data.
              </p>
            </div>
            <Button variant="destructive" className="bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
