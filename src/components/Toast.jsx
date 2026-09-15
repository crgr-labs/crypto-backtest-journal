import { CheckIcon, AlertCircleIcon, XIcon } from './Icons'

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === 'error'
              ? 'border-rose-500/30 bg-rose-950/80 text-rose-200 shadow-rose-950/40'
              : toast.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-950/80 text-emerald-200 shadow-emerald-950/40'
              : 'border-zinc-700 bg-zinc-900/90 text-zinc-200 shadow-black/60'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircleIcon className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <CheckIcon className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <p className="text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => onDismiss(toast.id)}
            className="ml-2 text-zinc-400 hover:text-zinc-200 p-0.5 rounded transition-colors"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

