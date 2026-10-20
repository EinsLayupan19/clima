import { ArrowClockwiseIcon } from '@phosphor-icons/react'

interface ErrorStateProps {
  title: string
  message: string
  onRetry?: () => void
}

function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <section aria-labelledby="error-title" className="max-w-xl">
      <h1
        id="error-title"
        className="text-2xl font-semibold tracking-tight text-balance wrap-break-word sm:text-3xl"
      >
        {title}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-pretty text-ink-muted">{message}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium transition-[scale,background-color] duration-150 ease-out hover:bg-surface active:scale-[0.97]"
        >
          <ArrowClockwiseIcon aria-hidden="true" className="size-4" />
          Try again
        </button>
      )}
    </section>
  )
}

export default ErrorState
