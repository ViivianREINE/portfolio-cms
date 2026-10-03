const baseClass = 'mt-1.5 block w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 disabled:bg-stone-100'

function FieldShell({ id, label, error, hint, children, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-stone-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-rose-600" role="alert">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  )
}

export function Input({ id, label, error, hint, className = '', ...props }) {
  return <FieldShell id={id} label={label} error={error} hint={hint} className={className}><input id={id} className={baseClass} {...props} /></FieldShell>
}

export function Textarea({ id, label, error, hint, className = '', ...props }) {
  return <FieldShell id={id} label={label} error={error} hint={hint} className={className}><textarea id={id} className={`${baseClass} min-h-28 resize-y`} {...props} /></FieldShell>
}

export function Select({ id, label, error, hint, options, className = '', ...props }) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={className}>
      <select id={id} className={baseClass} {...props}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </FieldShell>
  )
}

export function Checkbox({ id, label, hint, className = '', ...props }) {
  return (
    <label htmlFor={id} className={`flex min-h-11 items-center gap-3 rounded-lg border border-stone-200 px-3.5 py-2.5 ${className}`}>
      <input id={id} type="checkbox" className="size-4 accent-emerald-700" {...props} />
      <span><span className="block text-sm font-semibold text-stone-700">{label}</span>{hint && <span className="block text-xs text-stone-500">{hint}</span>}</span>
    </label>
  )
}