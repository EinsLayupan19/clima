/**
 * Placeholder shaped like the location heading it will be replaced by.
 * Hidden from screen readers; App announces "Searching for …" instead.
 */
function LoadingState() {
  return (
    <div aria-hidden="true" className="motion-safe:animate-pulse">
      <div className="h-12 w-56 max-w-full rounded-xl bg-surface sm:h-15" />
      <div className="mt-4 h-6 w-72 max-w-full rounded-xl bg-surface" />
    </div>
  )
}

export default LoadingState
