import { CheckIcon, AlertCircleIcon, XIcon } from './Icons'

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 rounded-xl border bg-white px-4 py-3.5 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === 'error'
              ? 'border-slate-200 border-l-4 border-l-rose-500 text-slate-800'
              : toast.type === 'success'
              ? 'border-slate-200 border-l-4 border-l-emerald-500 text-slate-800'
              : 'border-slate-200 border-l-4 border-l-indigo-500 text-slate-800'
          }`}
        >
          {toast.type === 'error' ? (
            <div className="h-7 w-7 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
              <AlertCircleIcon className="w-4 h-4 text-rose-600" />
            </div>
          ) : (
            <div className="h-7 w-7 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckIcon className="w-4 h-4 text-emerald-600" />
            </div>
          )}
          <p className="text-sm font-medium text-slate-800">{toast.message}</p>
          <button
            onClick={() => onDismiss(toast.id)}
            className="ml-2 text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
