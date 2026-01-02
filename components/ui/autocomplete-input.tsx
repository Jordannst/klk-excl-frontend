"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

interface AutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  storageKey: string
  placeholder?: string
  className?: string
}

export function AutocompleteInput({
  value,
  onChange,
  storageKey,
  placeholder,
  className,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = React.useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = React.useState<string[]>([])
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
    } else if (e.key === "Enter" && filteredSuggestions.length > 0 && showSuggestions) {
      e.preventDefault()
      handleSelectSuggestion(filteredSuggestions[0])
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
