'use client'

import { useEffect, useState } from 'react'
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastProps {
  toast: Toast
  onClose: (id: string) => void
}

function ToastItem({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id)
    }, toast.duration || 3000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onClose])

  const icons = {
    success: <CheckCircleIcon className="w-5 h-5 text-green-400" />,
    error: <XCircleIcon className="w-5 h-5 text-red-400" />,
    info: <InformationCircleIcon className="w-5 h-5 text-blue-400" />
  }

  const bgColors = {
    success: 'bg-green-900/90 border-green-700',
    error: 'bg-red-900/90 border-red-700',
    info: 'bg-blue-900/90 border-blue-700'
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${bgColors[toast.type]} backdrop-blur-sm animate-in slide-in-from-right-full duration-300`}
    >
      {icons[toast.type]}
      <p className="text-sm text-white flex-1">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  )
}
