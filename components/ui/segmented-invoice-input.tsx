"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SegmentedInvoiceInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

interface Segment {
  id: string
  placeholder: string
  width: string
  defaultValue?: string
}

const SEGMENTS: Segment[] = [
  { id: "num", placeholder: "520", width: "w-16" },
  { id: "type", placeholder: "INV", width: "w-14", defaultValue: "INV" },
  { id: "company", placeholder: "KLK", width: "w-14", defaultValue: "KLK" },
  { id: "branch", placeholder: "MDC", width: "w-14", defaultValue: "MDC" },
  { id: "year", placeholder: "2026", width: "w-16", defaultValue: new Date().getFullYear().toString() },
]

export function SegmentedInvoiceInput({
  value,
  onChange,
  className,
}: SegmentedInvoiceInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])
  
  // Parse value into segments
  const parseValue = (val: string): string[] => {
    if (!val) {
      return SEGMENTS.map(s => s.defaultValue || "")
    }
    const parts = val.split("/")
    return SEGMENTS.map((s, i) => parts[i] || s.defaultValue || "")
  }
  
  const [segments, setSegments] = React.useState<string[]>(() => parseValue(value))
  
  // Sync with external value changes
  React.useEffect(() => {
    setSegments(parseValue(value))
  }, [value])
  
  // Combine segments and notify parent
  const combineAndNotify = (newSegments: string[]) => {
    const combined = newSegments.join("/")
    onChange(combined)
  }
  
  const handleSegmentChange = (index: number, newValue: string) => {
    // Remove any slashes from input
    const cleanValue = newValue.replace(/\//g, "")
    
    const newSegments = [...segments]
    newSegments[index] = cleanValue
    setSegments(newSegments)
    combineAndNotify(newSegments)
    
    // Auto-advance to next input when segment is filled
    const segment = SEGMENTS[index]
    const expectedLength = segment.placeholder.length
    if (cleanValue.length >= expectedLength && index < SEGMENTS.length - 1) {
      inputRefs.current[index + 1]?.focus()
      inputRefs.current[index + 1]?.select()
    }
  }
  
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace if empty
    if (e.key === "Backspace" && segments[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    // Move forward on Tab or /
    if (e.key === "/" && index < SEGMENTS.length - 1) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
      inputRefs.current[index + 1]?.select()
    }
    // Move backward on Shift+Tab (handled by browser)
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {SEGMENTS.map((segment, index) => (
        <React.Fragment key={segment.id}>
          <input
            ref={(el) => { inputRefs.current[index] = el }}
            type="text"
            value={segments[index]}
            onChange={(e) => handleSegmentChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={(e) => e.target.select()}
            placeholder={segment.placeholder}
            className={cn(
              "h-10 px-2 text-center text-sm border border-slate-200 rounded-md",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "placeholder:text-slate-300",
              segment.width
            )}
          />
          {index < SEGMENTS.length - 1 && (
            <span className="text-slate-400 font-medium select-none">/</span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
