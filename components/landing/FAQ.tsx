"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "How does payment work?",
    answer: "When a client books you through BookMe, they pay a deposit you set — anywhere from 10% to 100% of your service price. The payment is processed securely via Flutterwave and the date is locked the moment it clears."
  },
  {
    question: "When do I receive my money?",
    answer: "Deposits are held securely and paid out to your bank account within 48 hours of a confirmed booking."
  },
  {
    question: "What if a client wants to cancel?",
    answer: "You can initiate a cancellation from your dashboard. Refund handling is reviewed on a case-by-case basis. A clear cancellation policy is coming in a future update."
  },
  {
    question: "Do clients need to create an account?",
    answer: "No. Clients can book and pay as a guest — no account needed. They receive a confirmation email with their booking details."
  },
  {
    question: "Is BookMe really free to use?",
    answer: "Yes. There are no monthly fees or setup costs. BookMe earns a small commission on each confirmed deposit. You only pay when you earn."
  },
  {
    question: "What types of vendors can use BookMe?",
    answer: "Any event service vendor — photographers, videographers, decorators, caterers, MCs, DJs, makeup artists, event planners, and more."
  }
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="bg-background px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-10 text-center font-heading text-3xl font-bold text-foreground md:text-4xl">
          Questions vendors ask.
        </h2>

        <div className="divide-y divide-border border-b border-border">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div key={index} className="flex flex-col">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="flex w-full items-center justify-between py-5 text-left text-sm font-medium text-foreground hover:opacity-80 focus:outline-none md:text-base"
                >
                  {faq.question}
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-subtle transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="pb-5 text-sm leading-relaxed text-subtle md:text-base">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
