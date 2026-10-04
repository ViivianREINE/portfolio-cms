import fs from 'node:fs'
import path from 'node:path'
import { api, contentRoot, listAll, loadContent, localApiBase, safeOriginalName } from './content-common.mjs'

function blankToNull(value) {
  if (value === undefined) return undefined
  if (typeof value === 'string' && value.trim() === '') return null
  return value
}

async function login(base) {
  if (process.env.CMS_TOKEN_FILE) {
    const token = fs.readFileSync(process.env.CMS_TOKEN_FILE, 'utf8').trim()
    fs.unlinkSync(process.env.CMS_TOKEN_FILE)
    if (!token) throw new Error('CMS_TOKEN_FILE was empty.')
    return token
  }
  if (process.env.CMS_ACCESS_TOKEN) return process.env.CMS_ACCESS_TOKEN
  const email = process.env.CMS_EMAIL
  const password = process.env.CMS_PASSWORD
  if (!email || !password) {
    throw new Error('Set CMS_EMAIL and CMS_PASSWORD, or CMS_ACCESS_TOKEN, before seeding.')
  }
  const response = await api(base, '', 'POST', '/auth/login', { email, password })
  const token = response?.data?.accessToken
  if (!token) throw new Error('Login did not return an access token.')
  return token
}

async function ensureMedia(base, token, content) {
  const mediaDir = process.env.CONTENT_MEDIA_DIR || path.resolve(contentRoot(), '..', 'reference-materials')
  const existing = await listAll(base, token, '/admin/media')
  const byName = new Map(existing.map((item) => [item.originalName, item]))
  const uploaded = []
  for (const asset of content.media || []) {
    const storedName = safeOriginalName(asset.file)
    const found = byName.get(storedName) || byName.get(asset.file)
    if (found) {
      uploaded.push({ ...asset, media: found, created: false })
      continue
    }
    const filePath = path.join(mediaDir, asset.file)
    if (!fs.existsSync(filePath)) throw new Error(`Media file not found: ${filePath}`)
    const bytes = fs.readFileSync(filePath)
    const form = new FormData()
    form.append('file', new Blob([bytes], { type: 'image/jpeg' }), asset.file)
    const response = await api(base, token, 'POST', '/admin/media/upload', form, true)
    uploaded.push({ ...asset, media: response.data, created: true })
  }
  return uploaded
}

async function seedAbout(base, token, about, media) {
  const profile = media.find((item) => item.role === 'profile')?.media
  let current = null
  try {
    current = (await api(base, token, 'GET', '/admin/about')).data
  } catch (error) {
    if (!String(error.message).includes('(404)')) throw error
  }
  const payload = {
    headline: about.headline,
    shortBio: about.shortBio,
    longBio: about.longBio,
    location: about.location,
    email: about.email,
    phone: about.phone,
    resumeUrl: blankToNull(about.resumeUrl),
    socialLinks: about.socialLinks,
    profileData: about.profileData,
  }
  if (!current?.profileImageId && profile?.id) payload.profileImageId = profile.id
  if (current?.id) {
    await api(base, token, 'PUT', `/admin/about/${current.id}`, payload)
    return 'updated'
  }
  await api(base, token, 'POST', '/admin/about', payload)
  return 'created'
}

async function seedSkills(base, token, skills) {
  const existing = await listAll(base, token, '/admin/skills')
  const byName = new Map(existing.map((item) => [item.name.toLowerCase(), item]))
  let created = 0
  let updated = 0
  for (const skill of skills) {
    const payload = {
      name: skill.name,
      category: skill.category,
      proficiency: skill.proficiency,
      displayOrder: skill.displayOrder,
      active: skill.active,
    }
    const match = byName.get(skill.name.toLowerCase())
    if (match) {
      await api(base, token, 'PUT', `/admin/skills/${match.id}`, payload)
      updated += 1
    } else {
      await api(base, token, 'POST', '/admin/skills', payload)
      created += 1
    }
  }
  return { created, updated, untouched: existing.length - updated }
}

async function seedProjects(base, token, projects) {
  const existing = await listAll(base, token, '/admin/projects')
  const bySlug = new Map(existing.map((item) => [item.slug, item]))
  let created = 0
  let updated = 0
  for (const project of projects) {
    const payload = {
      title: project.title,
      slug: project.slug,
      shortDescription: project.shortDescription,
      description: project.description,
      featured: project.featured,
      published: project.published,
      projectUrl: blankToNull(project.projectUrl),
      githubUrl: blankToNull(project.githubUrl),
      stack: project.stack,
      displayOrder: project.displayOrder,
    }
    const match = bySlug.get(project.slug)
    if (match) {
      await api(base, token, 'PUT', `/admin/projects/${match.id}`, payload)
      updated += 1
    } else {
      await api(base, token, 'POST', '/admin/projects', payload)
      created += 1
    }
  }
  return { created, updated, untouched: existing.length - updated }
}

async function seedExperience(base, token, records) {
  const existing = await listAll(base, token, '/admin/experience')
  const keyOf = (item) => `${item.company.toLowerCase()}|${item.role.toLowerCase()}`
  const byKey = new Map(existing.map((item) => [keyOf(item), item]))
  let created = 0
  let updated = 0
  for (const record of records) {
    const payload = {
      company: record.company,
      role: record.role,
      employmentType: record.employmentType,
      startDate: record.startDate,
      endDate: record.endDate,
      current: record.current,
      description: record.description,
      displayOrder: record.displayOrder,
      location: blankToNull(record.location),
    }
    const match = byKey.get(keyOf(record))
    if (match) {
      await api(base, token, 'PUT', `/admin/experience/${match.id}`, payload)
      updated += 1
    } else {
      await api(base, token, 'POST', '/admin/experience', payload)
      created += 1
    }
  }
  return { created, updated, untouched: existing.length - updated }
}

async function seedHackathons(base, token, records = []) {
  const existing = await listAll(base, token, '/admin/achievements')
  const byTitle = new Map(existing.map((item) => [item.title.toLowerCase(), item]))
  let created = 0
  let updated = 0
  for (const record of records) {
    const payload = {
      title: record.title,
      organizer: blankToNull(record.organizer),
      date: record.date || null,
      location: blankToNull(record.location),
      result: blankToNull(record.result),
      placement: blankToNull(record.placement),
      projectName: blankToNull(record.projectName),
      description: blankToNull(record.description),
      technologies: record.technologies || [],
      githubUrl: blankToNull(record.githubUrl),
      liveUrl: blankToNull(record.liveUrl),
      linkedinUrl: blankToNull(record.linkedinUrl),
      featured: record.featured,
      displayOrder: record.displayOrder,
      active: record.active,
    }
    const match = byTitle.get(record.title.toLowerCase())
    if (match) {
      await api(base, token, 'PUT', `/admin/achievements/${match.id}`, payload)
      updated += 1
    } else {
      await api(base, token, 'POST', '/admin/achievements', payload)
      created += 1
    }
  }
  return { created, updated, untouched: existing.length - updated }
}

async function main() {
  const base = localApiBase()
  const token = await login(base)
  const content = loadContent()
  const media = await ensureMedia(base, token, content)
  const about = await seedAbout(base, token, content.about, media)
  const skills = await seedSkills(base, token, content.skills)
  const projects = await seedProjects(base, token, content.projects)
  const experience = await seedExperience(base, token, content.experience)
  const hackathons = await seedHackathons(base, token, content.hackathons)
  console.log(JSON.stringify({
    about,
    skills,
    projects,
    experience,
    hackathons,
    media: media.map((item) => ({ file: item.file, created: item.created, id: item.media.id })),
  }, null, 2))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
