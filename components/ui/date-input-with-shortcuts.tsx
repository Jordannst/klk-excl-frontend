"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format, addDays, subDays, isToday, isYesterday } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface DateInputWithShortcutsProps {
  value: string // Format: yyyy-MM-dd
  onChange: (value: string) => void
  className?: string
  id?: string
}

export function DateInputWithShortcuts({
  value,
  onChange,
  className,
  id,
}: DateInputWithShortcutsProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = React.useState(false)

  const currentDate = value ? new Date(value) : new Date()

  // Format date to yyyy-MM-dd for input value
  const formatForInput = (date: Date): string => {
    return format(date, "yyyy-MM-dd")
  }

  // Get display text for the date
  const getDisplayText = (): string => {
    if (!value) return ""
    const date = new Date(value)
    if (isToday(date)) return "Hari Ini"
    if (isYesterday(date)) return "Kemarin"
    return format(date, "EEEE, dd MMM", { locale: idLocale })
  }

  // Increment/Decrement date
  const incrementDate = () => {
    const newDate = addDays(currentDate, 1)
    onChange(formatForInput(newDate))
  }

  const decrementDate = () => {
    const newDate = subDays(currentDate, 1)
    onChange(formatForInput(newDate))
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault()
      incrementDate()
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      decrementDate()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="space-y-1">
      {/* Date Input with Navigation */}
      <div className="relative group">
        <div className="flex items-center gap-0">
          {/* Decrement Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={decrementDate}
            className="h-12 w-10 rounded-r-none border border-r-0 border-slate-200 hover:bg-slate-100 hover:text-blue-600 flex-shrink-0"
            tabIndex={-1}
            title="Tanggal sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Date Input */}
          <div className="relative flex-1">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 z-10" />
            <Input
              id={id}
              ref={inputRef}
              type="date"
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={cn(
                "pl-11 pr-3 h-12 text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500 bg-white rounded-none",
                className
              )}
            />
          </div>

          {/* Increment Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={incrementDate}
            className="h-12 w-10 rounded-l-none border border-l-0 border-slate-200 hover:bg-slate-100 hover:text-blue-600 flex-shrink-0"
            tabIndex={-1}
            title="Tanggal berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Display Label */}
        <div className="text-[11px] text-slate-500 font-medium mt-1">
          {getDisplayText() && (
            <span className={cn(
              "inline-flex items-center gap-1",
              isToday(currentDate) && "text-blue-600 font-semibold"
            )}>
              {getDisplayText()}
              {isFocused && (
                <span className="text-slate-400 ml-2">
                  ↑↓ untuk ubah tanggal
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

