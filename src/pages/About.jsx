import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { Image, Save, UserRound } from 'lucide-react'
import { getAbout, createAbout, updateAbout } from '../api/about'
import { listMedia } from '../api/media'
import Button from '../components/common/Button'
import { Input, Select, Textarea } from '../components/common/FormFields'
import { ErrorState, LoadingState } from '../components/common/States'
import useToast from '../hooks/useToast'
import { getErrorMessage, getFieldErrors } from '../utils/errors'

const aboutSchema = z.object({
  headline: z.string().max(200).optional(),
  shortBio: z.string().max(500).optional(),
  longBio: z.string().max(5000).optional(),
  profileImageId: z.string().uuid('Choose a valid media item.').or(z.literal('')).optional(),
  location: z.string().max(200).optional(),
  email: z.string().email('Enter a valid email.').or(z.literal('')).optional(),
  phone: z.string().max(50).optional(),
  resumeUrl: z.string().url('Enter a valid URL.').or(z.literal('')).optional(),
  socialLinks: z.string().optional(),
})

const formFields = ['headline', 'shortBio', 'longBio', 'profileImageId', 'location', 'email', 'phone', 'resumeUrl', 'socialLinks']

function initialValues(about) {
  return {
    headline: about?.headline || '', shortBio: about?.shortBio || '', longBio: about?.longBio || '',
    profileImageId: about?.profileImageId || '', location: about?.location || '', email: about?.email || '',
    phone: about?.phone || '', resumeUrl: about?.resumeUrl || '', socialLinks: JSON.stringify(about?.socialLinks || {}, null, 2),
  }
}

export default function About() {
  const queryClient = useQueryClient()
  const notify = useToast()
  const aboutQuery = useQuery({
    queryKey: ['about'],
    queryFn: async () => {
      try {
        return await getAbout()
      } catch (error) {
        if (error.response?.status === 404) return { success: true, data: null }
        throw error
      }
    },
  })
  const mediaQuery = useQuery({ queryKey: ['media', 1], queryFn: () => listMedia({ page: 1, limit: 20 }) })
  const about = aboutQuery.data?.data || null
  const mediaOptions = useMemo(() => (mediaQuery.data?.data || []).map((item) => ({ value: item.id, label: item.originalName })), [mediaQuery.data])
  const [apiError, setApiError] = useState('')
  const { register, reset, handleSubmit, setError, formState: { errors, dirtyFields, isSubmitting } } = useForm({ resolver: zodResolver(aboutSchema), defaultValues: initialValues(null) })

  useEffect(() => {
    if (aboutQuery.isSuccess) reset(initialValues(about))
  }, [aboutQuery.isSuccess, about, reset])

  const save = useMutation({
    mutationFn: ({ id, payload }) => id ? updateAbout(id, payload) : createAbout(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['about'] })
      setApiError('')
      notify('About profile saved.')
    },
    onError: (error) => {
      const fields = getFieldErrors(error)
      Object.entries(fields).forEach(([name, message]) => setError(name, { message }))
      setApiError(getErrorMessage(error))
    },
  })

  if (aboutQuery.isPending) return <LoadingState label="Loading the About profile…" />
  if (aboutQuery.isError) return <ErrorState message={getErrorMessage(aboutQuery.error)} onRetry={() => aboutQuery.refetch()} />

  const submit = (values) => {
    setApiError('')
    let valid = true
    const keys = about ? Object.keys(dirtyFields) : formFields
    const payload = Object.fromEntries(keys.map((key) => {
      if (key === 'socialLinks') {
        if (!values[key].trim()) return [key, null]
        try {
          return [key, JSON.parse(values[key])]
        } catch {
          valid = false
          setError(key, { message: 'Enter valid JSON for social links.' })
          return [key, null]
        }
      }
      if (key === 'profileImageId' && !values[key]) return [key, null]
      return [key, values[key] === '' ? null : values[key]]
    }))
    if (!valid) return
    save.mutate({ id: about?.id, payload })
  }

  return (
    <div className="space-y-5">
      <section><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Portfolio profile</p><h2 className="mt-1 text-2xl font-bold tracking-normal text-stone-900">About</h2><p className="mt-1.5 text-sm text-stone-500">Edit the profile content shown on your portfolio.</p></section>
      {!about && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">No About record exists yet. Saving creates the first profile.</div>}
      <form onSubmit={handleSubmit(submit)} noValidate className="overflow-hidden rounded-xl border border-stone-200/80 bg-white">
        <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-4 sm:px-7"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><UserRound size={19} /></span><div><h3 className="text-sm font-bold text-stone-900">Profile details</h3><p className="mt-0.5 text-xs text-stone-500">The existing profile is protected from accidental deletion.</p></div></div>
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
          <Input id="headline" label="Headline" maxLength={200} error={errors.headline?.message} {...register('headline')} />
          <Input id="location" label="Location" maxLength={200} error={errors.location?.message} {...register('location')} />
          <Textarea id="shortBio" label="Short bio" rows={3} maxLength={500} error={errors.shortBio?.message} className="sm:col-span-2" {...register('shortBio')} />
          <Textarea id="longBio" label="Long bio" rows={6} maxLength={5000} error={errors.longBio?.message} className="sm:col-span-2" {...register('longBio')} />
          <Input id="email" type="email" label="Contact email" error={errors.email?.message} {...register('email')} />
          <Input id="phone" label="Phone" error={errors.phone?.message} {...register('phone')} />
          <Input id="resumeUrl" type="url" label="Resume URL" error={errors.resumeUrl?.message} className="sm:col-span-2" {...register('resumeUrl')} />
          <Select id="profileImageId" label="Profile image" error={errors.profileImageId?.message} className="sm:col-span-2" options={[{ value: '', label: 'No profile image' }, ...mediaOptions]} {...register('profileImageId')} />
          {about?.profileImage?.publicUrl && <div className="flex items-center gap-3 sm:col-span-2"><img src={about.profileImage.publicUrl} alt="Current profile" className="size-16 rounded-lg border border-stone-200 object-cover" /><span className="text-xs text-stone-500">Current profile image</span><Image size={15} className="text-stone-400" /></div>}
          <Textarea id="socialLinks" label="Social links (JSON)" rows={5} hint={'Example: { "github": "https://github.com/name" }'} error={errors.socialLinks?.message} className="font-mono sm:col-span-2" {...register('socialLinks')} />
          {apiError && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800 sm:col-span-2" role="alert">{apiError}</p>}
        </div>
        <div className="flex justify-end border-t border-stone-100 px-5 py-4 sm:px-7"><Button type="submit" icon={Save} disabled={isSubmitting || save.isPending}>{save.isPending ? 'Saving…' : about ? 'Save changes' : 'Create profile'}</Button></div>
      </form>
    </div>
  )
}