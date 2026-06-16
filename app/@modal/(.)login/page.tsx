import { SlideOver } from "@/components/ui/SlideOver"
import LoginPage from "@/app/(auth)/login/page"

export default function LoginIntercept() {
  return (
    <SlideOver>
      <LoginPage />
    </SlideOver>
  )
}
