/**
 * Placeholder shaped like the current-weather view it will be replaced by.
 * Hidden from screen readers; App announces "Searching for …" instead.
 */
function LoadingState() {
  return (
    <div aria-hidden="true" className="motion-safe:animate-pulse">
      <div className="h-9 w-48 max-w-full rounded-xl bg-surface sm:h-10" />
      <div className="mt-2 h-6 w-64 max-w-full rounded-xl bg-surface" />

      <div className="mt-8 h-24 w-40 rounded-xl bg-surface sm:mt-10 sm:h-32 sm:w-52" />
      <div className="mt-4 h-7 w-36 rounded-xl bg-surface" />

      <div className="mt-10 grid grid-cols-2 gap-6 border-t border-line pt-6 sm:mt-12 sm:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item}>
            <div className="h-5 w-20 rounded-xl bg-surface" />
            <div className="mt-2 h-8 w-16 rounded-xl bg-surface" />
          </div>
        ))}
      </div>

      <div className="mt-12 sm:mt-16">
        <div className="h-7 w-36 rounded-xl bg-surface" />
        <div className="mt-3 border-t border-line pt-3 md:mt-4 md:grid md:grid-cols-7 md:gap-2 md:pt-6">
          {[0, 1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="py-3 md:py-0">
              <div className="h-11 rounded-xl bg-surface md:h-36" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LoadingState
