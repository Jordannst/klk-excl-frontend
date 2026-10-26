"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SegmentedInvoiceInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

// Auto-format invoice number: removes slashes, then inserts them at correct positions
// Format: XXX/INV/KLK/MDC/YYYY
const formatInvoiceNumber = (input: string): string => {
  // Remove all slashes and spaces
  const clean = input.replace(/[/\s]/g, "")
  
  if (!clean) return ""
  
  // Split into segments based on expected lengths
  // First segment: variable length (numbers only)
  // Next 3 segments: 3 chars each (INV, KLK, MDC)
  // Last segment: 4 chars (year)
  
  const parts: string[] = []
  let remaining = clean
  
  // Find where letters start (after the number prefix)
  const numMatch = remaining.match(/^(\d+)/)
  if (numMatch) {
    parts.push(numMatch[1])
    remaining = remaining.slice(numMatch[1].length)
  }
  
  // Split remaining into chunks of 3 or 4
  // INV, KLK, MDC = 3 chars each, Year = 4 chars
  if (remaining.length > 0) {
    // First 3-char segment (INV)
    parts.push(remaining.slice(0, 3))
    remaining = remaining.slice(3)
  }
  if (remaining.length > 0) {
    // Second 3-char segment (KLK)
    parts.push(remaining.slice(0, 3))
    remaining = remaining.slice(3)
  }
  if (remaining.length > 0) {
    // Third 3-char segment (MDC)
    parts.push(remaining.slice(0, 3))
    remaining = remaining.slice(3)
  }
  if (remaining.length > 0) {
    // Year segment (4 chars)
    parts.push(remaining.slice(0, 4))
  }
  
  return parts.filter(p => p).join("/")
}

export function SegmentedInvoiceInput({
  value,
  onChange,
  className,
}: SegmentedInvoiceInputProps) {
  const [inputValue, setInputValue] = React.useState(value || "")
  
  // Sync with external value
  React.useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || "")
    }
  }, [value])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const formatted = formatInvoiceNumber(raw)
    setInputValue(formatted)
    onChange(formatted)
  }
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow slash key to be typed but it will be auto-formatted
    // No special handling needed
  }

  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="520/INV/KLK/MDC/2026"
      className={cn(
        "w-full h-10 px-3 text-sm border border-slate-200 rounded-lg",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        "placeholder:text-slate-400",
        className
      )}
    />
  )
}
