"use client"

import Link from "next/link"

export default function NotFound() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>404</h2>
      <p>The page you are looking for could not be found.</p>
      <Link href="/" style={{ padding: "0.5rem 1rem", marginTop: "1rem", display: "inline-block" }}>
        Return Home
      </Link>
    </div>
  )
}
