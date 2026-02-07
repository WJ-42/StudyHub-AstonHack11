import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50',
  secondary:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700 disabled:opacity-50',
  ghost:
    'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'rounded px-2 py-1 text-xs',
  md: 'rounded-lg px-4 py-2 text-sm',
  lg: 'rounded-xl px-6 py-3 text-base',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  )
}
