import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, Fingerprint, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import Button from '../components/common/Button'
import { Input } from '../components/common/FormFields'
import useAuth from '../hooks/useAuth'
import { getErrorMessage } from '../utils/errors'

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

export default function Login() {
  const { ready, isAuthenticated, signIn } = useAuth()
  const [apiError, setApiError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (ready && isAuthenticated) return <Navigate to="/dashboard" replace />

  const onSubmit = async (credentials) => {
    setApiError('')
    try {
      await signIn(credentials)
    } catch (error) {
      setApiError(getErrorMessage(error, 'Sign in could not be completed.'))
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f7f1ea] lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
      <section className="relative hidden overflow-hidden bg-[#3e2c27] px-12 py-12 text-[#fbf7f3] lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'radial-gradient(#e6d0c8 0.7px, transparent 0.7px)', backgroundSize: '18px 18px' }} />
        <div className="relative flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white/10"><Fingerprint size={20} /></span><span className="text-sm font-bold tracking-wide">Portfolio CMS</span></div>
        <div className="relative max-w-xl pb-8"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#e6d0c8]"><span className="h-px w-7 bg-[#d4b5ab]" /> Private content desk</p><h1 className="mt-6 font-serif text-5xl font-semibold leading-[1.08] tracking-normal xl:text-6xl">The room behind the portfolio.</h1><p className="mt-6 max-w-md text-base leading-7 text-[#f4e7e1]/80">Edit the record once, in the section that owns it.</p><div className="mt-10 flex items-center gap-3 text-sm text-[#f4e7e1]/80"><ShieldCheck size={17} /> Administrator session</div></div>
        <p className="relative text-xs text-emerald-100/50">Portfolio CMS <span className="mx-2">/</span> Private workspace</p>
        <div className="absolute -bottom-40 -right-36 size-[440px] rounded-full border border-white/10" /><div className="absolute -bottom-24 -right-20 size-[300px] rounded-full border border-white/10" />
      </section>
      <section className="flex min-h-screen flex-col justify-center px-5 py-12 sm:px-10 lg:px-14 xl:px-24">
        <div className="mx-auto w-full max-w-[410px]">
          <div className="mb-9 flex items-center gap-3 lg:hidden"><span className="grid size-10 place-items-center rounded-xl bg-emerald-800 text-white"><Fingerprint size={20} /></span><span className="text-sm font-bold text-stone-900">Portfolio CMS</span></div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Administrator access</p>
          <h2 className="mt-3 text-3xl font-bold tracking-normal text-stone-900">Welcome back</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">Sign in to continue to your workspace.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
            <Input id="email" type="email" label="Email address" autoComplete="username" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
            <Input id="password" type="password" label="Password" autoComplete="current-password" placeholder="Enter your password" error={errors.password?.message} {...register('password')} />
            {apiError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800">{apiError}</div>}
            <Button type="submit" className="w-full" icon={isSubmitting ? undefined : ArrowRight} disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in'}</Button>
          </form>
          <div className="mt-8 flex items-center gap-2 border-t border-stone-200 pt-5 text-xs text-stone-400"><LockKeyhole size={14} /><span>Credentials are sent securely to the portfolio API.</span></div>
        </div>
      </section>
    </main>
  )
}