import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { GraduationCap, Plus, Save, Trash2, Trophy, UserRound, Users } from 'lucide-react'
import { createAbout, getAbout, updateAbout } from '../api/about'
import { listAllMedia } from '../api/media'
import Button from '../components/common/Button'
import ConfirmDialog from '../components/common/ConfirmDialog'
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
  github: z.string().url('Enter a valid URL.').or(z.literal('')).optional(),
  linkedin: z.string().url('Enter a valid URL.').or(z.literal('')).optional(),
  portfolio: z.string().url('Enter a valid URL.').or(z.literal('')).optional(),
})

const blank = {
  education: { institution: '', credential: '', start: '', end: '', detail: '', location: '' },
  achievements: { title: '', detail: '', project: '' },
  strengths: { title: '', detail: '' },
  volunteering: { role: '', organization: '', start: '', end: '', detail: '' },
}

function textValues(about) {
  const links = about?.socialLinks || {}
  return {
    headline: about?.headline || '',
    shortBio: about?.shortBio || '',
    longBio: about?.longBio || '',
    profileImageId: about?.profileImageId || '',
    location: about?.location || '',
    email: about?.email || '',
    phone: about?.phone || '',
    resumeUrl: about?.resumeUrl || '',
    github: links.github || '',
    linkedin: links.linkedin || '',
    portfolio: links.portfolio || '',
  }
}

function profileValues(about) {
  const data = about?.profileData || {}
  return {
    education: data.education?.length ? data.education : [],
    achievements: data.achievements?.length ? data.achievements : [],
    strengths: data.strengths?.length ? data.strengths : [],
    volunteering: data.volunteering?.length ? data.volunteering : [],
  }
}

function clean(value) {
  if (typeof value !== 'string') return value ?? null
  const trimmed = value.trim()
  return trimmed || null
}

function Section({ icon: Icon, title, hint, onAdd, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-stone-200/80 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4 sm:px-7">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><Icon size={18} /></span>
          <div>
            <h3 className="text-sm font-bold text-stone-900">{title}</h3>
            <p className="mt-0.5 text-xs text-stone-500">{hint}</p>
          </div>
        </div>
        <Button type="button" variant="secondary" icon={Plus} onClick={onAdd}>Add</Button>
      </div>
      <div className="space-y-4 p-5 sm:p-7">{children}</div>
    </section>
  )
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
  const mediaQuery = useQuery({ queryKey: ['media', 'all'], queryFn: listAllMedia })
  const about = aboutQuery.data?.data || null
  const mediaOptions = useMemo(() => (mediaQuery.data?.data || []).map((item) => ({ value: item.id, label: item.originalName })), [mediaQuery.data])
  const [profileDraft, setProfileDraft] = useState(null)
  const [imageOverride, setImageOverride] = useState(null)
  const [pendingRemoval, setPendingRemoval] = useState(null)
  const profile = profileDraft || profileValues(about)
  const selectedImage = imageOverride ?? about?.profileImageId ?? ''
  const [apiError, setApiError] = useState('')
  const { register, reset, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(aboutSchema),
    defaultValues: textValues(null),
  })
  const imageField = register('profileImageId')
  const preview = (mediaQuery.data?.data || []).find((item) => item.id === selectedImage) || about?.profileImage

  useEffect(() => {
    if (aboutQuery.isSuccess) reset(textValues(about))
  }, [aboutQuery.isSuccess, about, reset])

  const save = useMutation({
    mutationFn: ({ id, payload }) => id ? updateAbout(id, payload) : createAbout(payload),
    onSuccess: async () => {
      setProfileDraft(null)
      setImageOverride(null)
      await queryClient.invalidateQueries({ queryKey: ['about'] })
      setApiError('')
      notify('About profile saved.')
    },
    onError: (error) => {
      const fields = getFieldErrors(error)
      Object.entries(fields).forEach(([name, message]) => {
        if (['github', 'linkedin', 'portfolio'].includes(name) || name.startsWith('socialLinks')) {
          setError(name.replace('socialLinks.', ''), { message })
        } else setError(name, { message })
      })
      setApiError(getErrorMessage(error))
    },
  })

  const updateRow = (section, index, field, value) => {
    setProfileDraft({
      ...profile,
      [section]: profile[section].map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row),
    })
  }

  const submit = (values) => {
    setApiError('')
    const payload = {
      headline: clean(values.headline),
      shortBio: clean(values.shortBio),
      longBio: clean(values.longBio),
      profileImageId: values.profileImageId || null,
      location: clean(values.location),
      email: clean(values.email),
      phone: clean(values.phone),
      resumeUrl: clean(values.resumeUrl),
      socialLinks: {
        ...(about?.socialLinks || {}),
        github: clean(values.github),
        linkedin: clean(values.linkedin),
        portfolio: clean(values.portfolio),
      },
      profileData: {
        education: profile.education.filter((row) => row.institution.trim()).map((row) => ({
          institution: row.institution.trim(),
          credential: clean(row.credential),
          start: clean(row.start),
          end: clean(row.end),
          detail: clean(row.detail),
          location: clean(row.location),
        })),
        achievements: profile.achievements.filter((row) => row.title.trim()).map((row) => ({
          title: row.title.trim(),
          detail: clean(row.detail),
          project: clean(row.project),
        })),
        strengths: profile.strengths.filter((row) => row.title.trim()).map((row) => ({
          title: row.title.trim(),
          detail: clean(row.detail),
        })),
        volunteering: profile.volunteering.filter((row) => row.role.trim() && row.organization.trim()).map((row) => ({
          role: row.role.trim(),
          organization: row.organization.trim(),
          start: clean(row.start),
          end: clean(row.end),
          detail: clean(row.detail),
        })),
      },
    }
    save.mutate({ id: about?.id, payload })
  }

  if (aboutQuery.isPending) return <LoadingState label="Loading the About profile…" />
  if (aboutQuery.isError) return <ErrorState message={getErrorMessage(aboutQuery.error)} onRetry={() => aboutQuery.refetch()} />

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Profile</p>
          <h2 className="mt-1 text-2xl font-bold tracking-normal text-stone-900">About</h2>
          <p className="mt-1.5 max-w-2xl text-sm text-stone-500">Hero, narrative, education, strengths, achievements, and volunteering each have their own place.</p>
        </div>
        <Button type="submit" icon={Save} disabled={isSubmitting || save.isPending}>{save.isPending ? 'Saving…' : about ? 'Save profile' : 'Create profile'}</Button>
      </section>
      {!about && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">No About record exists yet. Saving creates the first profile.</div>}

      <section className="overflow-hidden rounded-xl border border-stone-200/80 bg-white">
        <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-4 sm:px-7">
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><UserRound size={19} /></span>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Public introduction</h3>
            <p className="mt-0.5 text-xs text-stone-500">The headline and short bio are the home introduction. The long bio stays on About.</p>
          </div>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
          <Input id="headline" label="Headline" maxLength={200} error={errors.headline?.message} {...register('headline')} />
          <Input id="location" label="Location" maxLength={200} error={errors.location?.message} {...register('location')} />
          <Textarea id="shortBio" label="Hero statement" rows={3} maxLength={500} error={errors.shortBio?.message} className="sm:col-span-2" {...register('shortBio')} />
          <Textarea id="longBio" label="About narrative" rows={7} maxLength={5000} error={errors.longBio?.message} className="sm:col-span-2" {...register('longBio')} />
          <Select id="profileImageId" label="Profile image" error={errors.profileImageId?.message} className="sm:col-span-2" options={[{ value: '', label: 'No profile image' }, ...mediaOptions]} {...imageField} onChange={(event) => { imageField.onChange(event); setImageOverride(event.target.value) }} />
          {preview?.publicUrl && <div className="flex items-center gap-3 sm:col-span-2"><img src={preview.publicUrl} alt="" className="size-16 rounded-lg border border-stone-200 object-cover" /><span className="text-xs text-stone-500">{preview.originalName || 'Selected profile image'}</span></div>}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-stone-200/80 bg-white">
        <div className="border-b border-stone-100 px-5 py-4 sm:px-7">
          <h3 className="text-sm font-bold text-stone-900">Contact</h3>
          <p className="mt-0.5 text-xs text-stone-500">Phone, email, and social links stay on this profile. They are not copied into projects.</p>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
          <Input id="email" type="email" label="Email" error={errors.email?.message} {...register('email')} />
          <Input id="phone" label="Phone" error={errors.phone?.message} {...register('phone')} />
          <Input id="resumeUrl" type="url" label="Resume file URL" error={errors.resumeUrl?.message} className="sm:col-span-2" {...register('resumeUrl')} />
          <Input id="github" type="url" label="GitHub" error={errors.github?.message} {...register('github')} />
          <Input id="linkedin" type="url" label="LinkedIn" error={errors.linkedin?.message} {...register('linkedin')} />
          <Input id="portfolio" type="url" label="Portfolio" error={errors.portfolio?.message} className="sm:col-span-2" {...register('portfolio')} />
        </div>
      </section>

      <Section icon={GraduationCap} title="Education" hint="Stored in profile data, separate from the narrative." onAdd={() => setProfileDraft({ ...profile, education: [...profile.education, { ...blank.education }] })}>
        {profile.education.length ? profile.education.map((row, index) => (
          <div key={`education-${index}`} className="grid gap-3 rounded-lg border border-stone-100 p-4 sm:grid-cols-2">
            <Input id={`education-institution-${index}`} label="Institution" value={row.institution} onChange={(event) => updateRow('education', index, 'institution', event.target.value)} />
            <Input id={`education-credential-${index}`} label="Credential" value={row.credential || ''} onChange={(event) => updateRow('education', index, 'credential', event.target.value)} />
            <Input id={`education-start-${index}`} label="Start" value={row.start || ''} onChange={(event) => updateRow('education', index, 'start', event.target.value)} />
            <Input id={`education-end-${index}`} label="End" value={row.end || ''} onChange={(event) => updateRow('education', index, 'end', event.target.value)} />
            <Input id={`education-location-${index}`} label="Location" value={row.location || ''} onChange={(event) => updateRow('education', index, 'location', event.target.value)} />
            <Input id={`education-detail-${index}`} label="Detail" value={row.detail || ''} onChange={(event) => updateRow('education', index, 'detail', event.target.value)} />
            <div className="sm:col-span-2"><Button type="button" variant="ghost" icon={Trash2} onClick={() => setPendingRemoval({ section: 'education', index, label: row.institution || 'this education record' })}>Remove</Button></div>
          </div>
        )) : <p className="text-sm text-stone-500">No education records yet.</p>}
      </Section>

      <Section icon={Trophy} title="Achievements" hint="Competitions and open-source recognition. Dates stay blank when the source has none." onAdd={() => setProfileDraft({ ...profile, achievements: [...profile.achievements, { ...blank.achievements }] })}>
        {profile.achievements.length ? profile.achievements.map((row, index) => (
          <div key={`achievement-${index}`} className="grid gap-3 rounded-lg border border-stone-100 p-4">
            <Input id={`achievement-title-${index}`} label="Title" value={row.title} onChange={(event) => updateRow('achievements', index, 'title', event.target.value)} />
            <Textarea id={`achievement-detail-${index}`} label="Detail" rows={3} value={row.detail || ''} onChange={(event) => updateRow('achievements', index, 'detail', event.target.value)} />
            <Input id={`achievement-project-${index}`} label="Related project" value={row.project || ''} onChange={(event) => updateRow('achievements', index, 'project', event.target.value)} />
            <Button type="button" variant="ghost" icon={Trash2} onClick={() => setPendingRemoval({ section: 'achievements', index, label: row.title || 'this achievement' })}>Remove</Button>
          </div>
        )) : <p className="text-sm text-stone-500">No achievements yet.</p>}
      </Section>

      <Section icon={UserRound} title="Strengths" hint="Short distinctions. Keep tool lists in Skills." onAdd={() => setProfileDraft({ ...profile, strengths: [...profile.strengths, { ...blank.strengths }] })}>
        {profile.strengths.length ? profile.strengths.map((row, index) => (
          <div key={`strength-${index}`} className="grid gap-3 rounded-lg border border-stone-100 p-4">
            <Input id={`strength-title-${index}`} label="Title" value={row.title} onChange={(event) => updateRow('strengths', index, 'title', event.target.value)} />
            <Textarea id={`strength-detail-${index}`} label="Detail" rows={3} value={row.detail || ''} onChange={(event) => updateRow('strengths', index, 'detail', event.target.value)} />
            <Button type="button" variant="ghost" icon={Trash2} onClick={() => setPendingRemoval({ section: 'strengths', index, label: row.title || 'this strength' })}>Remove</Button>
          </div>
        )) : <p className="text-sm text-stone-500">No strengths yet.</p>}
      </Section>

      <Section icon={Users} title="Volunteering" hint="Organizational roles. This copy is not repeated in the About narrative." onAdd={() => setProfileDraft({ ...profile, volunteering: [...profile.volunteering, { ...blank.volunteering }] })}>
        {profile.volunteering.length ? profile.volunteering.map((row, index) => (
          <div key={`volunteering-${index}`} className="grid gap-3 rounded-lg border border-stone-100 p-4 sm:grid-cols-2">
            <Input id={`volunteer-role-${index}`} label="Role" value={row.role} onChange={(event) => updateRow('volunteering', index, 'role', event.target.value)} />
            <Input id={`volunteer-organization-${index}`} label="Organization" value={row.organization} onChange={(event) => updateRow('volunteering', index, 'organization', event.target.value)} />
            <Input id={`volunteer-start-${index}`} label="Start" value={row.start || ''} onChange={(event) => updateRow('volunteering', index, 'start', event.target.value)} />
            <Input id={`volunteer-end-${index}`} label="End" value={row.end || ''} onChange={(event) => updateRow('volunteering', index, 'end', event.target.value)} />
            <Textarea id={`volunteer-detail-${index}`} label="Detail" rows={3} value={row.detail || ''} onChange={(event) => updateRow('volunteering', index, 'detail', event.target.value)} className="sm:col-span-2" />
            <div className="sm:col-span-2"><Button type="button" variant="ghost" icon={Trash2} onClick={() => setPendingRemoval({ section: 'volunteering', index, label: row.role || 'this volunteering record' })}>Remove</Button></div>
          </div>
        )) : <p className="text-sm text-stone-500">No volunteering records yet.</p>}
      </Section>

      {apiError && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800" role="alert">{apiError}</p>}
      <div className="flex justify-end"><Button type="submit" icon={Save} disabled={isSubmitting || save.isPending}>{save.isPending ? 'Saving…' : about ? 'Save profile' : 'Create profile'}</Button></div>
      <ConfirmDialog
        open={Boolean(pendingRemoval)}
        title="Remove this section?"
        description={`“${pendingRemoval?.label || 'This item'}” will leave the form. Save the profile to keep that change.`}
        onCancel={() => setPendingRemoval(null)}
        onConfirm={() => {
          if (!pendingRemoval) return
          setProfileDraft({
            ...profile,
            [pendingRemoval.section]: profile[pendingRemoval.section].filter((_, index) => index !== pendingRemoval.index),
          })
          setPendingRemoval(null)
        }}
      />
    </form>
  )
}
