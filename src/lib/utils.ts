import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Strips non-digit characters and caps the result at 10 digits. */
export function sanitizePhoneNumber(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10)
}
