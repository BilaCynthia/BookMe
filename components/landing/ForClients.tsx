import Image from "next/image"
import { ShieldCheck, FileCheck, CalendarHeart } from "lucide-react"

export function ForClients() {
  return (
    <section className="bg-surface px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:gap-16 lg:gap-24 items-center">
        
        {/* Text and Features Side */}
        <div className="flex flex-col justify-center order-2 md:order-1">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-subtle">
            For clients
          </p>
          <h2 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-4xl">
            Book your vendor with confidence.
          </h2>
          <p className="mb-10 text-lg text-subtle">
            When you book through BookMe, you get more than a date — you get peace of mind.
          </p>

          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-secondary" />
              <div>
                <h3 className="mb-1 font-heading text-lg font-medium text-foreground">
                  Secure payment.
                </h3>
                <p className="text-sm leading-relaxed text-subtle">
                  Pay your deposit safely via card, bank transfer, or USSD. Powered by Flutterwave.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <FileCheck className="mt-0.5 h-6 w-6 shrink-0 text-secondary" />
              <div>
                <h3 className="mb-1 font-heading text-lg font-medium text-foreground">
                  Instant confirmation.
                </h3>
                <p className="text-sm leading-relaxed text-subtle">
                  Get a booking confirmation with your reference number the moment payment clears.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CalendarHeart className="mt-0.5 h-6 w-6 shrink-0 text-secondary" />
              <div>
                <h3 className="mb-1 font-heading text-lg font-medium text-foreground">
                  Your date is guaranteed.
                </h3>
                <p className="text-sm leading-relaxed text-subtle">
                  Once you pay, the vendor&apos;s date is locked for you. No one else can take it.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Image Side */}
        <div className="relative order-1 md:order-2 h-[400px] md:h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl">
          <Image
            src="/for_clients.png"
            alt="Event setup representing peace of mind"
            fill
            className="object-cover hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

      </div>
    </section>
  )
}
