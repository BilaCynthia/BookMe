import Link from "next/link"
import Image from "next/image"
import { ShieldCheck, ArrowRight, CheckCircle2, Wallet } from "lucide-react"
import { Button } from "@/components/ui/Button"

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-32 md:pt-32 md:pb-40 bg-background px-4 md:px-6">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 w-full max-w-7xl h-full">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[100px] opacity-70 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/30 blur-[100px] opacity-70" />
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Hero Text */}
          <div className="flex flex-col space-y-8 animate-in slide-in-from-bottom-8 duration-700 fade-in fill-mode-both">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary w-fit">
              <ShieldCheck className="mr-2 h-4 w-4" />
              No payment, no booking. Period.
            </div>
            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Stop losing money to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">uncommitted</span> clients.
            </h1>
            <p className="text-lg md:text-xl text-subtle max-w-lg leading-relaxed">
              BookMe replaces endless DMs with one shareable link. Clients pick a date, pay a deposit, and instantly lock it in.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button asChild size="lg" className="w-full sm:w-auto text-base h-14 px-8 shadow-xl shadow-primary/20 gap-2">
                <Link href="/signup" prefetch={true}>
                  Get Your Link Free <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-base h-14 px-8 bg-surface/50 backdrop-blur-sm">
                <Link href="#how-it-works">
                  See How It Works
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center gap-4 pt-6 text-sm font-medium text-subtle">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Free setup</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Flutterwave integrated</div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative mx-auto w-full max-w-[500px] lg:max-w-none animate-in slide-in-from-right-12 duration-1000 fade-in fill-mode-both delay-300">
            <div className="relative rounded-3xl border border-border/50 bg-surface/40 p-2 backdrop-blur-xl shadow-2xl overflow-hidden aspect-[4/3] lg:aspect-square">
              <Image 
                src="/hero_mockup.png" 
                alt="BookMe UI Mockup" 
                fill 
                className="object-cover rounded-2xl"
                priority
              />
              {/* Floating Notification Badge */}
              <div className="absolute -bottom-6 -left-6 rounded-2xl border border-border/50 bg-background/90 p-4 shadow-2xl backdrop-blur-md hidden md:flex items-center gap-4 animate-bounce hover:animate-none">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20">
                  <Wallet className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Deposit Received!</p>
                  <p className="text-xs text-subtle">Date locked for Emeka.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
