'use client'

import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import { Button } from '@/components/ui/button'
import { CustomDialog } from './dialog'

export interface DialogConfig {
  id?: string
  title?: string
  message?: string
  description?: string
  type?: 'confirm' | 'alert'
  variant?: 'default' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  confirmText?: string
  cancelText?: string
  showCloseButton?: boolean
  onClose?: () => void
  onConfirm?: () => void
  onCancel?: () => void
  children?: ReactNode
  footer?: ReactNode
}

interface DialogItem extends DialogConfig {
  id: string
}

interface DialogContextType {
  openDialog: (config: DialogConfig) => string
  closeDialog: (id?: string) => void
  closeAllDialogs: () => void
  clearAllDialogs: () => void
}

const DialogContext = createContext<DialogContextType | null>(null)

export const useDialog = () => {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('useDialog must be used within DialogProvider')
  }
  return context
}

interface DialogProviderProps {
  children: ReactNode
}

export function DialogProvider({ children }: DialogProviderProps) {
  const [dialogs, setDialogs] = useState<DialogItem[]>([])

  const generateId = () =>
    `dialog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const openDialog = (newConfig: DialogConfig): string => {
    if (!newConfig) return ''

    const id = newConfig.id || generateId()
    const dialogItem: DialogItem = {
      ...newConfig,
      id,
    }

    setDialogs(prev => [...prev, dialogItem])
    return id
  }

  const closeDialog = (id?: string) => {
    if (id) {
      // Close specific dialog
      setDialogs(prev => prev.filter(dialog => dialog?.id !== id))
    } else {
      // Close most recent dialog
      setDialogs(prev => prev.slice(0, -1))
    }
  }

  const closeAllDialogs = () => {
    // Execute all dialog onClose callbacks then close
    dialogs.forEach(dialog => {
      try {
        dialog.onClose?.()
      } catch (error) {
        console.error('Dialog onClose error:', error)
      }
    })
    setDialogs([])
  }

  const clearAllDialogs = () => {
    // Close all dialogs immediately without callbacks
    setDialogs([])
  }

  const contextValue = {
    openDialog,
    closeDialog,
    closeAllDialogs,
    clearAllDialogs,
  }

  // Set context globally
  useEffect(() => {
    setDialogContext(contextValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      {dialogs.map((dialog, index) => (
        <DialogComponent
          key={dialog.id}
          dialog={dialog}
          isTopMost={index === dialogs.length - 1}
          onClose={() => closeDialog(dialog.id)}
        />
      ))}
    </DialogContext.Provider>
  )
}

interface DialogComponentProps {
  dialog: DialogItem
  isTopMost: boolean
  onClose: () => void
}

function DialogComponent({ dialog, onClose }: DialogComponentProps) {
  const handleClose = () => {
    try {
      if (dialog.onClose) {
        dialog.onClose()
      } else if (dialog.onCancel) {
        dialog.onCancel()
      } else {
        onClose()
      }
    } catch (error) {
      console.error('Dialog onClose error:', error)
    }
  }

  const handleConfirm = () => {
    try {
      if (dialog.onConfirm) {
        dialog.onConfirm()
      }
      onClose()
    } catch (error) {
      console.error('Dialog onConfirm error:', error)
    }
  }

  // Default footer generation
  const getDefaultFooter = () => {
    if (dialog.footer) return dialog.footer

    if (dialog?.type === 'alert') {
      return (
        <Button
          variant="primary"
          size="md"
          onClick={handleConfirm}
          className="w-full"
        >
          {dialog?.confirmText || '확인'}
        </Button>
      )
    }

    return (
      <div className="flex gap-3 w-full">
        <Button
          variant="outline"
          size="md"
          onClick={handleClose}
          className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          {dialog?.cancelText || '취소'}
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleConfirm}
          className={`flex-1 ${dialog?.variant === 'destructive'
            ? '!bg-red-600 hover:!bg-red-700 !text-white'
            : ''
            }`}
        >
          {dialog?.confirmText || '확인'}
        </Button>
      </div>
    )
  }

  return (
    <CustomDialog
      open={true}
      onOpenChange={open => !open && onClose()}
      title={dialog?.title || ''}
      description={dialog?.description || dialog?.message || ''}
      type={dialog?.type || 'confirm'}
      variant={dialog?.variant || 'default'}
      size={dialog?.size || 'md'}
      confirmText={dialog?.confirmText}
      cancelText={dialog?.cancelText}
      showCloseButton={dialog?.showCloseButton !== false}
      footer={getDefaultFooter()}
    >
      {dialog?.children}
    </CustomDialog>
  )
}

// Convenient functions for external use
let dialogContext: DialogContextType | null = null

export const setDialogContext = (context: DialogContextType) => {
  if (!context) return
  dialogContext = context
}

export const dialogOpen = (config: DialogConfig): string => {
  if (!config) {
    console.warn('Dialog config is required')
    return ''
  }

  if (!dialogContext) {
    console.warn(
      'Dialog context is not initialized. Make sure DialogProvider is mounted.',
    )
    return ''
  }

  try {
    return dialogContext.openDialog(config)
  } catch (error) {
    console.error('Failed to open dialog:', error)
    return ''
  }
}

export const dialogClose = (id?: string) => {
  if (!dialogContext) {
    console.warn(
      'Dialog context is not initialized. Make sure DialogProvider is mounted.',
    )
    return
  }

  try {
    if (id) {
      // If id is specified, close specific dialog
      dialogContext.closeDialog(id)
    } else {
      // If no id specified, close top (most recent) dialog
      dialogContext.closeDialog() // No ID = close most recent
    }
  } catch (error) {
    console.error('Failed to close dialog:', error)
  }
}

export const dialogCloseAll = () => {
  if (!dialogContext) {
    console.warn(
      'Dialog context is not initialized. Make sure DialogProvider is mounted.',
    )
    return
  }

  try {
    dialogContext.closeAllDialogs()
  } catch (error) {
    console.error('Failed to close all dialogs:', error)
  }
}

export const dialogClear = () => {
  if (!dialogContext) {
    console.warn(
      'Dialog context is not initialized. Make sure DialogProvider is mounted.',
    )
    return
  }

  try {
    dialogContext.clearAllDialogs()
  } catch (error) {
    console.error('Failed to clear all dialogs:', error)
  }
}


// Convenience functions - all use dialogOpen for consistency
export const dialogAlert = (title: string, message?: string, confirmText?: string) => {
  return dialogOpen({
    type: 'alert',
    title,
    description: message,
    confirmText: confirmText || '확인',
  })
}

export const dialogConfirm = (
  title: string,
  message?: string,
  onConfirm?: () => void,
  onCancel?: () => void,
  options?: Partial<DialogConfig>
) => {
  return dialogOpen({
    type: 'confirm',
    title,
    description: message,
    onConfirm,
    onCancel,
    ...options,
  })
}

export const dialogDestructive = (
  title: string,
  message?: string,
  onConfirm?: () => void,
  confirmText?: string
) => {
  return dialogOpen({
    type: 'confirm',
    variant: 'destructive',
    title,
    description: message,
    onConfirm,
    confirmText: confirmText || '삭제',
  })
}