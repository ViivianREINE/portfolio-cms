const variants = {
  primary: 'bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:ring-emerald-600',
  secondary: 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 focus-visible:ring-stone-400',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500',
  ghost: 'text-stone-600 hover:bg-stone-100 focus-visible:ring-stone-400',
}

export default function Button({ variant = 'primary', icon: Icon, className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={16} aria-hidden="true" />}
      {children}
    </button>
  )
}