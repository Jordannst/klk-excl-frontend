"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { History, Search, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface AutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  storageKey: string
  placeholder?: string
  className?: string
  id?: string
}

export function AutocompleteInput({
  value,
  onChange,
  storageKey,
  placeholder,
  className,
  id,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = React.useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = React.useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = React.useState(-1)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Load suggestions from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem(`autocomplete_${storageKey}`)
    if (stored) {
      try {
        setSuggestions(JSON.parse(stored))
      } catch {
        setSuggestions([])
      }
    }
  }, [storageKey])

  // Filter suggestions based on input
  React.useEffect(() => {
    if (value.length > 0) {
      const filtered = suggestions.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredSuggestions(filtered)
    } else {
      setFilteredSuggestions(suggestions.slice(0, 5)) // Show last 5 when empty
    }
    setSelectedIndex(-1) // Reset selection when suggestions change
  }, [value, suggestions])

  // Save new value to localStorage
  const saveToHistory = (newValue: string) => {
    if (!newValue.trim()) return
    
    const stored = localStorage.getItem(`autocomplete_${storageKey}`)
    let history: string[] = []
    if (stored) {
      try {
        history = JSON.parse(stored)
      } catch {
        history = []
      }
    }
    
    // Remove duplicate and add to front
    history = history.filter((h) => h.toLowerCase() !== newValue.toLowerCase())
    history.unshift(newValue.trim())
    
    // Keep only last 20 entries
    history = history.slice(0, 20)
    
    localStorage.setItem(`autocomplete_${storageKey}`, JSON.stringify(history))
    setSuggestions(history)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setShowSuggestions(true)
  }

  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleBlur = (e: React.FocusEvent) => {
    // Delay hiding to allow click on suggestion
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false)
        // Save current value to history when leaving field
        if (value.trim()) {
          saveToHistory(value)
        }
      }
    }, 200)
  }

  const handleFocus = () => {
    setShowSuggestions(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (!showSuggestions) {
        setShowSuggestions(true)
        return
      }
      setSelectedIndex((prev) => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Enter") {
      if (showSuggestions && selectedIndex >= 0) {
        e.preventDefault()
        handleSelectSuggestion(filteredSuggestions[selectedIndex])
      } else if (showSuggestions && filteredSuggestions.length > 0 && value.trim() === "") {
        // If empty input and suggestions shown, select first on enter if nothing selected
        e.preventDefault()
        handleSelectSuggestion(filteredSuggestions[0])
      }
    } else if (e.key === "Tab" && showSuggestions && filteredSuggestions.length > 0) {
      e.preventDefault()
      if (e.shiftKey) {
        // Shift+Tab = go backwards
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1))
      } else {
        // Tab = go forwards (cycle through)
        setSelectedIndex((prev) => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        )
      }
    }
  }

  const isSearching = value.length > 0

  return (
    <div ref={containerRef} className="relative w-full group">
      <div className="relative">
        <Input
          id={id}
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "pr-10 transition-all duration-200",
            showSuggestions && filteredSuggestions.length > 0 && "rounded-b-none border-b-transparent ring-1 ring-blue-100",
            className
          )}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
          {isSearching ? (
            <Search className="h-4 w-4 animate-in fade-in zoom-in duration-300" />
          ) : (
            <Clock className="h-4 w-4 animate-in fade-in zoom-in duration-300" />
          )}
        </div>
      </div>
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-b-lg shadow-xl max-h-64 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            {isSearching ? (
              <Search className="h-3 w-3 text-slate-500" />
            ) : (
              <History className="h-3 w-3 text-slate-500" />
            )}
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
              {isSearching ? "Hasil Pencarian" : "Riwayat Terakhir"}
            </span>
          </div>
          
          <div className="overflow-y-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm transition-all flex items-center gap-3",
                  selectedIndex === index 
                    ? "bg-blue-50 text-blue-700 pl-6" 
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <div className={cn(
                  "h-1.5 w-1.5 rounded-full transition-all",
                  selectedIndex === index ? "bg-blue-500 scale-125" : "bg-slate-200"
                )} />
                <span className="flex-1 truncate">{suggestion}</span>
                {selectedIndex === index && (
                  <span className="text-[10px] font-medium text-blue-400 bg-blue-100/50 px-1.5 py-0.5 rounded animate-in fade-in slide-in-from-right-1">
                    Pilih
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

