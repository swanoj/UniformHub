import Link from 'next/link';

type Props = {
  icon?: string;
  heading: string;
  body?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
};

export function EmptyState({ icon = "•", heading, body, action, className = "" }: Props) {
  const actionClassName = "inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700";

  return (
    <div className={`rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-12 text-center ${className}`}>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-2xl">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900">{heading}</h3>
      {body && <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{body}</p>}
      {action?.href ? (
        <Link href={action.href} className={`${actionClassName} mt-6`}>
          {action.label}
        </Link>
      ) : action?.onClick ? (
        <button type="button" onClick={action.onClick} className={`${actionClassName} mt-6`}>
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
