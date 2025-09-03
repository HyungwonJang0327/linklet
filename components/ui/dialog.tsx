'use client'

import * as React from 'react'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { type VariantProps, cva } from 'class-variance-authority'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const dialogContentVariants = cva(
  'fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-6 border border-slate-700/50 bg-slate-800/95 backdrop-blur-sm p-6 shadow-xl duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
  {
    variants: {
      variant: {
        default: 'bg-slate-800/95 border-slate-700/50',
        destructive: 'bg-slate-800/95 border-red-500/30',
      },
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

type RefNVariant = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> &
  VariantProps<typeof dialogContentVariants>

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  RefNVariant
>(({ className, children, variant, size, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(dialogContentVariants({ variant, size, className }))}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4 text-slate-400" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className,
    )}
    {...props}
  />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className,
    )}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg leading-none font-semibold tracking-tight text-white',
      className,
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-slate-400', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

// Custom Dialog Component
interface CustomDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  type?: 'confirm' | 'alert'
  confirmText?: string
  cancelText?: string
  children?: React.ReactNode
  className?: string
  footer?: React.ReactNode
  showCloseButton?: boolean
}

const CustomDialog = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  CustomDialogProps
>(
  (
    {
      open,
      onOpenChange,
      title,
      description,
      variant = 'default',
      size = 'md',
      type = 'confirm',
      confirmText = '확인',
      cancelText = '취소',
      children,
      className,
      footer,
      showCloseButton = true,
      ...props
    },
    ref,
  ) => {
    // Defense code: required props validation
    if (open === undefined) {
      console.warn('CustomDialog: open prop is required')
      return null
    }

    const handleOpenChange = (newOpen: boolean) => {
      try {
        onOpenChange?.(newOpen)
      } catch (error) {
        console.error('CustomDialog onOpenChange error:', error)
      }
    }

    // Default footer generation
    const getDefaultFooter = () => {
      if (footer) return footer

      if (type === 'alert') {
        return (
          <Button
            variant="primary"
            size="md"
            onClick={() => onOpenChange?.(false)}
            className="w-full"
          >
            {confirmText}
          </Button>
        )
      }

      return (
        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            size="md"
            onClick={() => onOpenChange?.(false)}
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'primary' : 'primary'}
            size="md"
            onClick={() => onOpenChange?.(false)}
            className={cn(
              'flex-1',
              variant === 'destructive' && 'bg-red-600 hover:bg-red-700'
            )}
          >
            {confirmText}
          </Button>
        </div>
      )
    }

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          ref={ref}
          variant={variant}
          size={size}
          className={className}
          {...props}
        >
          {!showCloseButton && (
            <style jsx>{`
              [data-state="open"] button[data-dialog-close] {
                display: none;
              }
            `}</style>
          )}
          
          {(title || description) && (
            <DialogHeader className="mb-4">
              {title && (
                <DialogTitle className="text-center whitespace-pre-line">
                  {title}
                </DialogTitle>
              )}
              {description && (
                <DialogDescription className="text-center mt-2">
                  {description}
                </DialogDescription>
              )}
            </DialogHeader>
          )}
          
          {children && (
            <div className="text-slate-300 text-center">
              {children}
            </div>
          )}
          
          <DialogFooter className={type === 'alert' ? 'justify-center' : 'flex-row gap-2 mt-6'}>
            {getDefaultFooter()}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  },
)
CustomDialog.displayName = 'CustomDialog'

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  CustomDialog,
}