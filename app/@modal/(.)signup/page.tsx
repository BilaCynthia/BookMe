import { SlideOver } from "@/components/ui/SlideOver"
import SignupPage from "@/app/(auth)/signup/page"

export default function SignupIntercept() {
  return (
    <SlideOver>
      <SignupPage />
    </SlideOver>
  )
}
