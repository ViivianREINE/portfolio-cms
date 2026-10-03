import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export function loadContent() {
  const file = path.join(root, 'content-source', 'portfolio-content.json')
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

export function contentRoot() {
  return root
}

export function normalize(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function collectTexts(content) {
  const slots = []
  const add = (slot, value) => {
    const text = String(value || '').trim()
    if (text) slots.push({ slot, text, key: normalize(text) })
  }
  const about = content.about || {}
  add('about.shortBio', about.shortBio)
  add('about.longBio', about.longBio)
  for (const item of about.profileData?.strengths || []) add(`strength:${item.title}`, item.detail)
  for (const item of about.profileData?.volunteering || []) add(`volunteering:${item.role}`, item.detail)
  for (const item of about.profileData?.achievements || []) add(`achievement:${item.title}`, item.detail)
  for (const item of content.experience || []) add(`experience:${item.company}:${item.role}`, item.description)
  for (const item of content.projects || []) {
    add(`project:${item.slug}:short`, item.shortDescription)
    add(`project:${item.slug}:description`, item.description)
  }
  return slots
}

export function auditContent(content) {
  const errors = []
  const skillNames = new Map()
  for (const skill of content.skills || []) {
    const key = normalize(skill.name)
    if (skillNames.has(key)) errors.push(`Duplicate skill: ${skill.name}`)
    skillNames.set(key, skill)
  }
  const python = (content.skills || []).find((skill) => normalize(skill.name) === 'python')
  if (!python) errors.push('Python skill is missing.')
  else if (python.category !== 'Programming' || python.proficiency !== 90 || python.displayOrder !== 1 || python.active !== true) {
    errors.push('Python must stay category Programming, proficiency 90, displayOrder 1, active true.')
  }

  const slugs = new Map()
  const urls = new Map()
  const featured = []
  for (const project of content.projects || []) {
    if (slugs.has(project.slug)) errors.push(`Duplicate project slug: ${project.slug}`)
    slugs.set(project.slug, project)
    if (project.featured && project.published) featured.push(project.slug)
    for (const field of ['projectUrl', 'githubUrl']) {
      if (!project[field]) continue
      const url = project[field]
      if (urls.has(url)) errors.push(`Duplicate project URL ${url} on ${project.slug} and ${urls.get(url)}`)
      urls.set(url, project.slug)
    }
  }
  if (featured.length !== 6) errors.push(`Expected 6 featured published projects, found ${featured.length}.`)

  const achievements = new Map()
  for (const item of content.about?.profileData?.achievements || []) {
    const key = normalize(item.title)
    if (achievements.has(key)) errors.push(`Duplicate achievement: ${item.title}`)
    achievements.set(key, item)
  }

  const experienceKeys = new Map()
  const experienceText = new Map()
  for (const item of content.experience || []) {
    const key = `${normalize(item.company)}|${normalize(item.role)}`
    if (experienceKeys.has(key)) errors.push(`Duplicate experience: ${item.role} at ${item.company}`)
    experienceKeys.set(key, item)
    const text = normalize(item.description)
    if (experienceText.has(text)) errors.push(`Repeated experience description: ${item.role} at ${item.company}`)
    experienceText.set(text, key)
  }

  const slots = collectTexts(content)
  const seen = new Map()
  for (const slot of slots) {
    if (slot.key.length < 40) continue
    if (seen.has(slot.key)) errors.push(`Repeated paragraph in ${seen.get(slot.key)} and ${slot.slot}`)
    seen.set(slot.key, slot.slot)
  }

  const longBio = normalize(content.about?.longBio)
  const shortBio = normalize(content.about?.shortBio)
  if (longBio && shortBio && (longBio.includes(shortBio) || shortBio.includes(longBio))) {
    errors.push('Hero sentence is repeated inside the About narrative.')
  }
  for (const project of content.projects || []) {
    const description = normalize(project.description)
    if (description && longBio.includes(description)) errors.push(`Project description repeated in About: ${project.slug}`)
  }
  for (const item of content.experience || []) {
    const description = normalize(item.description)
    if (description && longBio.includes(description)) errors.push(`Experience description repeated in About: ${item.role}`)
  }

  return errors
}

export function localApiBase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed while NODE_ENV=production.')
  }
  const api = process.env.CONTENT_API_URL || process.env.VITE_API_URL || 'http://localhost:5000/api'
  const url = new URL(api)
  if (!['localhost', '127.0.0.1'].includes(url.hostname)) {
    throw new Error('Refusing to seed a non-local API.')
  }
  return api.replace(/\/$/, '')
}

export async function api(base, token, method, pathname, body, isForm = false) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  let payload
  if (body && isForm) payload = body
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  const response = await fetch(`${base}${pathname}`, { method, headers, body: payload })
  const text = await response.text()
  let data = null
  if (text) {
    try { data = JSON.parse(text) } catch { data = { message: text } }
  }
  if (!response.ok) {
    const message = data?.message || response.statusText
    const extra = data?.errors ? ` ${JSON.stringify(data.errors)}` : ''
    throw new Error(`${method} ${pathname} failed (${response.status}): ${message}${extra}`)
  }
  return data
}

export async function listAll(base, token, pathname) {
  const first = await api(base, token, 'GET', `${pathname}?page=1&limit=20`)
  const rows = [...(first.data || [])]
  const pages = first.meta?.totalPages || 1
  for (let page = 2; page <= pages; page += 1) {
    const next = await api(base, token, 'GET', `${pathname}?page=${page}&limit=20`)
    rows.push(...(next.data || []))
  }
  return rows
}

export function safeOriginalName(name) {
  return name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '-')
}
