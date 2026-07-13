/* eslint-disable react/prop-types */
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export default function Toast({ toasts, onRemove }) {
  return (
    <div className="fixed top-6 right-6 z-50 space-y-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-start gap-4 rounded-lg p-5 shadow-lg border bg-white border-black/10 text-neutral-900 max-w-md animate-slideIn"
          style={{
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid rgba(15, 15, 17, 0.08)',
            animation: 'slideIn 0.24s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div className="flex-shrink-0 mt-0.5 text-neutral-700">
            {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 stroke-[1.5]" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5 stroke-[1.5]" />}
            {toast.type === 'info' && <Info className="h-5 w-5 stroke-[1.5]" />}
          </div>
          
          <div className="flex-1">
            {toast.title && (
              <p className="font-medium text-sm text-neutral-950 font-display tracking-tight">
                {toast.title}
              </p>
            )}
            {toast.message && (
              <p className="text-sm mt-1 text-neutral-600 font-display leading-relaxed">
                {toast.message}
              </p>
            )}
          </div>
          
          <button
            onClick={() => onRemove(toast.id)}
            className="flex-shrink-0 mt-0.5 text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <X className="h-4 w-4 stroke-[1.5]" />
          </button>
        </div>
      ))}
    </div>
  )
}
