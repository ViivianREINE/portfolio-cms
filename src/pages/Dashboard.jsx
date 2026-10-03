import { useQuery } from '@tanstack/react-query'
import { ArrowRight, BookOpenText, BriefcaseBusiness, FolderKanban, Image, MessageSquareText, Quote, Sparkles, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import blogsApi from '../api/blogs'
import experienceApi from '../api/experience'
import projectsApi from '../api/projects'
import servicesApi from '../api/services'
import skillsApi from '../api/skills'
import testimonialsApi from '../api/testimonials'
import { listMessages } from '../api/messages'
import { ErrorState, LoadingState } from '../components/common/States'
import { formatDate } from '../utils/format'
import { getErrorMessage } from '../utils/errors'

const summaryItems = [
  { label: 'Projects', key: 'projects', path: '/projects', icon: FolderKanban, tone: 'bg-sky-50 text-sky-800' },
  { label: 'Articles', key: 'blogs', path: '/blogs', icon: BookOpenText, tone: 'bg-orange-50 text-orange-800' },
  { label: 'Skills', key: 'skills', path: '/skills', icon: Sparkles, tone: 'bg-violet-50 text-violet-800' },
  { label: 'Testimonials', key: 'testimonials', path: '/testimonials', icon: Quote, tone: 'bg-rose-50 text-rose-800' },
  { label: 'Services', key: 'services', path: '/services', icon: Wrench, tone: 'bg-emerald-50 text-emerald-800' },
  { label: 'Messages', key: 'messages', path: '/messages', icon: MessageSquareText, tone: 'bg-amber-50 text-amber-800' },
]

const apiByKey = { projects: projectsApi, blogs: blogsApi, skills: skillsApi, testimonials: testimonialsApi, services: servicesApi, experience: experienceApi }

function countFrom(result) {
  return result?.meta?.total ?? result?.data?.length ?? 0
}

export default function Dashboard() {
  const summary = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const entries = await Promise.all([
        ...Object.entries(apiByKey).map(async ([key, api]) => [key, await api.list({ page: 1, limit: 20 })]),
        ['messages', await listMessages({ page: 1, limit: 20 })],
      ])
      return Object.fromEntries(entries)
    },
  })

  if (summary.isPending) return <LoadingState label="Loading your portfolio overview…" />
  if (summary.isError) return <ErrorState message={getErrorMessage(summary.error)} onRetry={() => summary.refetch()} />

  const messages = summary.data.messages.data || []
  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-2xl border border-emerald-950/10 bg-[#173b32] px-6 py-7 text-white sm:px-8 sm:py-8">
        <div className="absolute inset-y-0 right-0 hidden w-[42%] opacity-25 sm:block" style={{ backgroundImage: 'linear-gradient(135deg, transparent 45%, #b5d7bf 45%, #b5d7bf 45.5%, transparent 45.5%), linear-gradient(45deg, transparent 65%, #b5d7bf 65%, #b5d7bf 65.5%, transparent 65.5%)' }} />
        <div className="relative max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Portfolio overview</p><h2 className="mt-3 text-2xl font-semibold tracking-normal sm:text-3xl">Your work, at a glance.</h2><p className="mt-2 text-sm leading-6 text-emerald-50/70">A live snapshot of the content connected to your portfolio.</p><Link to="/projects" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-emerald-100">Manage portfolio <ArrowRight size={15} /></Link></div>
        <div className="absolute -bottom-14 right-12 hidden size-44 rounded-full border border-white/15 sm:block" /><div className="absolute -bottom-3 right-28 hidden size-24 rounded-full border border-white/15 sm:block" />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {summaryItems.map((item, index) => {
          const Icon = item.icon
          const total = countFrom(summary.data[item.key])
          return <Link key={item.key} to={item.path} className="group rounded-xl border border-stone-200/80 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md" style={{ animationDelay: `${index * 45}ms` }}><div className="flex items-start justify-between"><span className={`grid size-10 place-items-center rounded-xl ${item.tone}`}><Icon size={19} /></span><ArrowRight size={16} className="text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" /></div><div className="mt-5"><p className="text-sm font-medium text-stone-500">{item.label}</p><p className="mt-1 text-3xl font-bold tabular-nums text-stone-900">{total}</p></div></Link>
        })}
      </section>

      <section className="overflow-hidden rounded-xl border border-stone-200/80 bg-white">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4 sm:px-6"><div><h3 className="text-sm font-bold text-stone-900">Recent messages</h3><p className="mt-1 text-xs text-stone-500">Latest contact form submissions</p></div><Link to="/messages" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950">View inbox <ArrowRight size={14} /></Link></div>
        {messages.length ? <div className="divide-y divide-stone-100">{messages.slice(0, 5).map((message) => <Link key={message.id} to="/messages" className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-stone-50 sm:px-6"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-stone-100 text-xs font-bold text-stone-600">{message.name?.slice(0, 1)?.toUpperCase() || 'M'}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-stone-800">{message.name}</span><span className="block truncate text-xs text-stone-500">{message.subject || message.email}</span></span><span className="hidden text-xs text-stone-400 sm:block">{formatDate(message.createdAt)}</span><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${message.status === 'NEW' ? 'bg-amber-50 text-amber-800' : 'bg-stone-100 text-stone-600'}`}>{message.status}</span></Link>)}</div> : <div className="px-6 py-9 text-center text-sm text-stone-500"><MessageSquareText className="mx-auto mb-2 text-stone-300" size={22} />No messages to review.</div>}
      </section>

      <div className="grid gap-3 sm:grid-cols-2"><Link to="/experience" className="flex items-center gap-4 rounded-xl border border-stone-200/80 bg-white px-5 py-4 hover:border-emerald-200"><span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-800"><BriefcaseBusiness size={18} /></span><span className="flex-1"><span className="block text-sm font-bold text-stone-800">Experience</span><span className="block text-xs text-stone-500">{countFrom(summary.data.experience)} records</span></span><ArrowRight size={16} className="text-stone-400" /></Link><Link to="/media" className="flex items-center gap-4 rounded-xl border border-stone-200/80 bg-white px-5 py-4 hover:border-emerald-200"><span className="grid size-10 place-items-center rounded-xl bg-orange-50 text-orange-800"><Image size={18} /></span><span className="flex-1"><span className="block text-sm font-bold text-stone-800">Media library</span><span className="block text-xs text-stone-500">Manage portfolio images</span></span><ArrowRight size={16} className="text-stone-400" /></Link></div>
    </div>
  )
}