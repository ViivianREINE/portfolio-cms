import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  AlignLeft, BookOpenText, BriefcaseBusiness, CircleUserRound,
  FolderKanban, Image, LayoutDashboard, LogOut, Menu, MessageSquareText,
  Quote, Settings2, Sparkles, X,
} from 'lucide-react'
import useAuth from '../../hooks/useAuth'

const navigation = [
  { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { label: 'About', path: '/about', icon: CircleUserRound },
  { label: 'Skills', path: '/skills', icon: Sparkles },
  { label: 'Projects', path: '/projects', icon: FolderKanban },
  { label: 'Blogs', path: '/blogs', icon: BookOpenText },
  { label: 'Experience', path: '/experience', icon: BriefcaseBusiness },
  { label: 'Testimonials', path: '/testimonials', icon: Quote },
  { label: 'Services', path: '/services', icon: Settings2 },
  { label: 'Messages', path: '/messages', icon: MessageSquareText },
  { label: 'Media', path: '/media', icon: Image },
]

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, signOut } = useAuth()
  const location = useLocation()
  const currentPage = navigation.find((item) => item.path === location.pathname)?.label || 'Overview'

  const closeMobile = () => setMobileOpen(false)
  const sidebar = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-[76px] items-center justify-between border-b border-stone-100 px-5">
        <NavLink to="/dashboard" className="flex items-center gap-3" onClick={closeMobile}>
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-800 text-white"><AlignLeft size={18} /></span>
          <span><span className="block text-sm font-extrabold leading-4 text-stone-900">Portfolio CMS</span><span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">Content desk</span></span>
        </NavLink>
        <button type="button" onClick={closeMobile} aria-label="Close navigation" className="grid size-9 place-items-center rounded-lg text-stone-500 hover:bg-stone-100 lg:hidden"><X size={18} /></button>
      </div>
      <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Workspace</p>
        {navigation.map(({ label, path, icon: Icon }) => (
          <NavLink key={path} to={path} onClick={closeMobile} className={({ isActive }) => `group flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${isActive ? 'bg-emerald-50 text-emerald-900' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'}`}>
            {({ isActive }) => <><Icon size={17} className={isActive ? 'text-emerald-700' : 'text-stone-400 group-hover:text-stone-600'} /><span className="flex-1">{label}</span>{isActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" />}</>}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-stone-100 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-stone-50 p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-900">{user?.name?.slice(0, 1)?.toUpperCase() || 'A'}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-stone-800">{user?.name || 'Administrator'}</span><span className="block truncate text-xs text-stone-500">{user?.email}</span></span>
          <button type="button" onClick={signOut} title="Sign out" aria-label="Sign out" className="grid size-8 place-items-center rounded-lg text-stone-400 hover:bg-white hover:text-stone-700"><LogOut size={16} /></button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f7f1ea] text-stone-800">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] border-r border-stone-200/80 lg:block">{sidebar}</aside>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-stone-950/35 lg:hidden" onMouseDown={(event) => event.target === event.currentTarget && closeMobile()}><aside className="h-full w-[min(300px,86vw)] border-r border-stone-200 shadow-xl">{sidebar}</aside></div>}
      <div className="min-h-screen lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-stone-200/80 bg-[#f7f1ea]/95 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3"><button type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" className="grid size-9 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600 lg:hidden"><Menu size={18} /></button><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">Portfolio / {currentPage}</p><h1 className="mt-0.5 text-base font-bold leading-5 text-stone-900">{currentPage}</h1></div></div>
          <div className="flex items-center gap-2"><div className="hidden text-right sm:block"><p className="text-sm font-semibold text-stone-700">{user?.name || 'Administrator'}</p><p className="text-[11px] text-stone-400">{user?.email}</p></div><span className="grid size-9 place-items-center rounded-full border border-stone-200 bg-white text-emerald-800 sm:hidden">{user?.name?.slice(0, 1)?.toUpperCase() || 'A'}</span><span className="hidden h-7 w-px bg-stone-200 sm:block" /><button type="button" onClick={signOut} className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold text-stone-600 hover:bg-white hover:text-stone-900" aria-label="Sign out"><LogOut size={16} /><span className="hidden sm:inline">Sign out</span></button></div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-7 sm:py-8"><Outlet /></main>
        <footer className="px-4 pb-6 text-center text-[11px] text-stone-400 sm:px-7 lg:text-left">Portfolio CMS <span className="mx-1.5">·</span> Private workspace</footer>
      </div>
    </div>
  )
}