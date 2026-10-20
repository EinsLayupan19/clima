import { MagnifyingGlassIcon } from '@phosphor-icons/react'
import { useId, useState, type FormEvent, type RefObject } from 'react'
import { normalizeQuery } from '../lib/weatherUtils.ts'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch: (query: string) => void
  inputRef: RefObject<HTMLInputElement | null>
}

function SearchBar({ value, onChange, onSearch, inputRef }: SearchBarProps) {
  const [isBlank, setIsBlank] = useState(false)
  const inputId = useId()
  const errorId = useId()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = normalizeQuery(value)

    if (!query) {
      setIsBlank(true)
      inputRef.current?.focus()
      return
    }

    setIsBlank(false)
    onSearch(query)
  }

  function handleChange(nextValue: string) {
    if (isBlank) setIsBlank(false)
    onChange(nextValue)
  }

  return (
    <form role="search" onSubmit={handleSubmit} noValidate>
      <label htmlFor={inputId} className="text-sm font-medium">
        City
      </label>

      <div className="mt-2 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-muted"
          />
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            maxLength={100}
            placeholder="e.g. Lisbon or Paris, Texas"
            value={value}
            onChange={(event) => handleChange(event.target.value)}
            aria-invalid={isBlank}
            aria-describedby={isBlank ? errorId : undefined}
            className="h-12 w-full rounded-xl border border-line bg-surface pr-4 pl-11 text-base text-ink transition-colors placeholder:text-ink-muted hover:border-ink-muted aria-invalid:border-danger"
          />
        </div>

        <button
          type="submit"
          className="h-12 shrink-0 rounded-xl bg-accent px-5 text-base font-medium text-accent-ink transition-[scale,background-color] duration-150 ease-out hover:bg-accent/90 active:scale-[0.97]"
        >
          Search
        </button>
      </div>

      {isBlank && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-danger">
          Enter a city name to search.
        </p>
      )}
    </form>
  )
}

export default SearchBar
