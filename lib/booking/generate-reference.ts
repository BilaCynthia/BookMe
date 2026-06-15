import { customAlphabet } from "nanoid"

// Uppercase alphanumeric, no confusable characters (0, O, I, 1)
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const nanoid = customAlphabet(alphabet, 8)

export function generateBookingReference(): string {
  return `BKM-${nanoid()}`
}
