import { AlertCircle } from 'lucide-react';

type Props = {
  heading?: string;
  body?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  heading = "Couldn't load this",
  body = "Check your connection and try again.",
  onRetry,
  className = "",
}: Props) {
  return (
    <div className={`rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-700 ${className}`}>
      <AlertCircle className="mx-auto mb-3 h-8 w-8" />
      <h3 className="text-lg font-bold">{heading}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-rose-600">{body}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
