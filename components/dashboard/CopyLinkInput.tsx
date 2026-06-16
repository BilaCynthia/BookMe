"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

interface CopyLinkInputProps {
  link: string
}

export function CopyLinkInput({ link }: CopyLinkInputProps) {
  const [copied, setCopied] = React.useState(false)

  return (
    <div className="flex w-full items-center gap-2">
      <div className="flex-1 min-w-0">
        <Input value={link} readOnly className="w-full" />
      </div>
      <Button 
        type="button"
        className="shrink-0 w-28"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          } catch (e) {
            // Fallback
            const textArea = document.createElement("textarea")
            textArea.value = link
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand("copy")
            document.body.removeChild(textArea)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }
        }}
      >
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Copied
          </>
        ) : (
          <>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </>
        )}
      </Button>
    </div>
  )
}
