import { NavigationArrowIcon } from '@phosphor-icons/react'

interface LocationButtonProps {
  onClick: () => void
  /** While true the button ignores clicks, so the browser is never asked twice at once. */
  isLocating: boolean
}

/** A quiet, secondary alternative to typing a city. */
function LocationButton({ onClick, isLocating }: LocationButtonProps) {
  return (
    <button
      type="button"
      onClick={isLocating ? undefined : onClick}
      // aria-disabled (not disabled) keeps the button focusable while it works.
      aria-disabled={isLocating}
      className="-ml-1 inline-flex h-10 items-center gap-2 rounded-xl px-1 text-sm font-medium text-ink-muted transition-colors hover:text-ink aria-disabled:cursor-progress aria-disabled:opacity-60"
    >
      {/* Mirrored so the arrow points up and to the right, like most map apps. */}
      <NavigationArrowIcon aria-hidden="true" className="size-4 -scale-x-100" />
      Use my location
    </button>
  )
}

export default LocationButton
