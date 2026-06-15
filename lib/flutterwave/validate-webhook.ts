import crypto from "crypto"

export function validateFlutterwaveWebhook(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature) return false

  const secret = process.env.FLUTTERWAVE_SECRET_HASH
  if (!secret) throw new Error("FLUTTERWAVE_SECRET_HASH not configured")

  // BookMe specifies FLUTTERWAVE_SECRET_HASH as the environment variable.
  // We use this value directly or as part of HMAC depending on Flutterwave version.
  // The SKILL document specifies using HMAC-SHA256:
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "utf8"),
      Buffer.from(expected, "utf8")
    )
  } catch {
    return false
  }
}
