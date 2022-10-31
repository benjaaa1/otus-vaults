import React from 'react'
import {
  toast,
  ToastContentProps,
  ToastOptions,
  UpdateOptions,
} from 'react-toastify'
import { Spinner } from '../Spinner'

export type ToastVariant = 'info' | 'success' | 'error' | 'warning'

type ToastRenderOptions = {
  variant?: ToastVariant
  description?: React.ReactNode
  hrefLabel?: React.ReactNode
  href?: string
}

export type ToastProps = ToastContentProps & ToastRenderOptions

export type CreateToastOptions = ToastRenderOptions & Omit<ToastOptions, 'type'>
export type UpdateToastOptions = ToastRenderOptions &
  Omit<UpdateOptions, 'render'>

export function createToast(options: CreateToastOptions): string {
  const {
    hrefLabel,
    href,
    variant,
    description,
    autoClose = false,
    ...toastOptions
  } = options
  const toastId = toast(
    ({ toastProps, closeToast }) => (
      <Toast
        variant={variant}
        description={description}
        hrefLabel={hrefLabel}
        href={href}
        toastProps={toastProps}
        closeToast={closeToast}
      />
    ),
    {
      ...toastOptions,
      autoClose,
      closeOnClick: false,
      draggable: false,
      progressStyle: { background: 'rgba(255, 255, 255, 0.4)' },
    }
  )
  return toastId as string
}

export function createPendingToast(
  options: Omit<CreateToastOptions, 'variant'>
): string {
  const { autoClose = false } = options
  return createToast({
    variant: 'info',
    icon: <Spinner />,
    autoClose,
    ...options,
  })
}

export function updatePendingToast(
  toastId: string,
  options: Omit<UpdateToastOptions, 'variant'>
): void {
  updateToast(toastId, {
    variant: 'info',
    icon: <Spinner size={20} />,
    ...options,
  })
}

export function updateToast(toastId: string, options: UpdateToastOptions) {
  const {
    href,
    variant,
    description,
    autoClose = false,
    ...updateOptions
  } = options
  if (toast.isActive(toastId)) {
    toast.update(toastId, {
      ...updateOptions,
      autoClose,
      progressStyle: { background: 'rgba(255, 255, 255, 0.4)' },
      draggable: false,
      closeOnClick: false,
      render: ({ toastProps, closeToast }) => (
        <Toast
          variant={variant}
          description={description}
          href={href}
          toastProps={toastProps}
          closeToast={closeToast}
        />
      ),
    })
  } else {
    createToast({ href, variant, autoClose: autoClose ?? undefined })
  }
}

export function closeToast(toastId: string): void {
  toast.dismiss(toastId)
}

const getToastVariantKey = (variant: ToastVariant): string => {
  switch (variant) {
    case 'info':
      return 'toastDefault'
    case 'success':
      return 'toastSuccess'
    case 'error':
      return 'toastError'
    case 'warning':
      return 'toastWarning'
  }
}
export default function Toast({
  variant = 'info',
  description,
  hrefLabel,
  href,
  closeToast,
}: ToastProps) {
  const toastVariant = getToastVariantKey(variant)

  return (
    <div
      onClick={() => {
        if (href != null) {
          window.open(href, '')
        } else if (closeToast != null) {
          closeToast()
        }
      }}
    >
      <span className="font-zinc-900">
        {description}
        <span className="font-zinc-900 font-medium">{hrefLabel}</span>
      </span>
    </div>
  )
}
