'use client'

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  toast: (message: string, type?: Toast['type']) => void
}

const noop: ToastContextValue = { toast: () => {} }

const ToastContext = createContext<ToastContextValue>(noop)

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const toast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg backdrop-blur-sm animate-slide-up pointer-events-auto ${
              t.type === 'success'
                ? 'bg-green-500/90 text-white'
                : t.type === 'error'
                  ? 'bg-red-500/90 text-white'
                  : 'bg-zinc-800/90 text-zinc-100'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
