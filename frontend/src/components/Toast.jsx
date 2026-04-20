/* eslint-disable react/prop-types */
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

export default function Toast({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-lg p-4 shadow-lg border max-w-md animate-slideIn ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-300'
              : toast.type === 'error'
              ? 'bg-red-50 border-red-300'
              : 'bg-blue-50 border-blue-300'
          }`}
        >
          <div className={`flex-shrink-0 mt-0.5 ${
            toast.type === 'success'
              ? 'text-green-600'
              : toast.type === 'error'
              ? 'text-red-600'
              : 'text-blue-600'
          }`}>
            {toast.type === 'success' && <CheckCircle className="h-5 w-5" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5" />}
            {toast.type === 'info' && <Info className="h-5 w-5" />}
          </div>
          <div className="flex-1">
            {toast.title && (
              <p className={`font-semibold text-sm ${
                toast.type === 'success'
                  ? 'text-green-900'
                  : toast.type === 'error'
                  ? 'text-red-900'
                  : 'text-blue-900'
              }`}>
                {toast.title}
              </p>
            )}
            {toast.message && (
              <p className={`text-sm mt-1 ${
                toast.type === 'success'
                  ? 'text-green-800'
                  : toast.type === 'error'
                  ? 'text-red-800'
                  : 'text-blue-800'
              }`}>
                {toast.message}
              </p>
            )}
          </div>
          <button
            onClick={() => onRemove(toast.id)}
            className={`flex-shrink-0 mt-0.5 ${
              toast.type === 'success'
                ? 'text-green-600 hover:text-green-700'
                : toast.type === 'error'
                ? 'text-red-600 hover:text-red-700'
                : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
