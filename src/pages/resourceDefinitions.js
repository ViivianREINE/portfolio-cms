import { z } from 'zod'
import skillsApi from '../api/skills'
import projectsApi from '../api/projects'
import blogsApi from '../api/blogs'
import experienceApi from '../api/experience'
import testimonialsApi from '../api/testimonials'
import servicesApi from '../api/services'
import achievementsApi from '../api/achievements'

const text = (max = 200) => z.string().trim().max(max, `Use ${max} characters or fewer.`)
const requiredText = (label, max = 200) => z.string().trim().min(1, `${label} is required.`).max(max)
const nullableUrl = z.string().trim().url('Enter a valid URL.').or(z.literal('')).optional().nullable()
const numberField = (min = 0, max = 100000) => z.preprocess((value) => value === '' || Number.isNaN(value) ? undefined : value, z.coerce.number().int().min(min).max(max).optional())

const slug = z.string().trim().min(1, 'Slug is required.').max(150).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, 'Use letters, numbers, and hyphens.')
const slugField = { name: 'slug', label: 'Slug', required: true, placeholder: 'project-name' }

export const resourceDefinitions = {
  skills: {
    key: 'skills', title: 'Skills', singular: 'skill', description: 'Keep your capabilities and proficiency current.', api: skillsApi,
    schema: z.object({ name: requiredText('Name', 120), category: text(120).nullable().optional(), proficiency: numberField(0, 100).nullable().optional(), icon: text(200).nullable().optional(), displayOrder: numberField(0).optional(), active: z.boolean().optional() }),
    fields: [
      { name: 'name', label: 'Name', required: true }, { name: 'category', label: 'Category' },
      { name: 'proficiency', label: 'Proficiency', type: 'number', min: 0, max: 100, nullable: true }, { name: 'icon', label: 'Icon name' },
      { name: 'displayOrder', label: 'Display order', type: 'number', min: 0 }, { name: 'active', label: 'Active', type: 'checkbox', defaultValue: true },
    ],
    columns: [{ key: 'name', label: 'Skill', strong: true }, { key: 'category', label: 'Category' }, { key: 'proficiency', label: 'Proficiency', suffix: '%' }, { key: 'displayOrder', label: 'Order' }, { key: 'active', label: 'Status', type: 'boolean' }],
  },
  projects: {
    key: 'projects', title: 'Projects', singular: 'project', description: 'Curate the work shown in your public portfolio.', api: projectsApi,
    galleryResource: 'projects',
    schema: z.object({ title: requiredText('Title'), slug, shortDescription: text(500).nullable().optional(), description: text(10000).nullable().optional(), featured: z.boolean().optional(), published: z.boolean().optional(), projectUrl: nullableUrl, githubUrl: nullableUrl, stack: text(1000).optional(), coverImageId: z.string().uuid('Enter a valid media ID.').or(z.literal('')).nullable().optional(), displayOrder: numberField(0).optional() }),
    fields: [
      { name: 'title', label: 'Title', required: true }, slugField, { name: 'shortDescription', label: 'Short description', type: 'textarea', rows: 2 },
      { name: 'description', label: 'Description', type: 'textarea', rows: 4 }, { name: 'stack', label: 'Technologies / stack', type: 'textarea', rows: 2, hint: 'Separate entries with commas.' },
      { name: 'projectUrl', label: 'Live project URL', type: 'url' }, { name: 'githubUrl', label: 'GitHub URL', type: 'url' },
      { name: 'coverImageId', label: 'Cover image', type: 'media', hint: 'Optional. Gallery images are managed below after the project is saved.' }, { name: 'displayOrder', label: 'Display order', type: 'number', min: 0 },
      { name: 'featured', label: 'Featured', type: 'checkbox' }, { name: 'published', label: 'Published', type: 'checkbox' },
    ],
    columns: [{ key: 'title', label: 'Project', strong: true }, { key: 'slug', label: 'Slug' }, { key: 'gallery', label: 'Gallery', type: 'count' }, { key: 'featured', label: 'Featured', type: 'boolean' }, { key: 'published', label: 'Published', type: 'boolean' }, { key: 'displayOrder', label: 'Order' }],
  },
  achievements: {
    key: 'achievements', title: 'Achievements / Hackathons', singular: 'hackathon', description: 'Hackathon records and their image galleries. Images are attached after you upload them.', api: achievementsApi,
    galleryResource: 'achievements',
    schema: z.object({
      title: requiredText('Title'),
      organizer: text().nullable().optional(),
      date: z.string().optional(),
      location: text().nullable().optional(),
      result: text(300).nullable().optional(),
      placement: text().nullable().optional(),
      projectName: text().nullable().optional(),
      description: text(10000).nullable().optional(),
      technologies: text(1000).optional(),
      githubUrl: nullableUrl,
      liveUrl: nullableUrl,
      linkedinUrl: nullableUrl,
      featured: z.boolean().optional(),
      displayOrder: numberField(0).optional(),
      active: z.boolean().optional(),
      coverImageId: z.string().uuid('Enter a valid media ID.').or(z.literal('')).nullable().optional(),
    }),
    fields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'organizer', label: 'Organizer' },
      { name: 'date', label: 'Date', type: 'datetime' },
      { name: 'location', label: 'Location' },
      { name: 'result', label: 'Result' },
      { name: 'placement', label: 'Placement' },
      { name: 'projectName', label: 'Project name' },
      { name: 'description', label: 'Description', type: 'textarea', rows: 4 },
      { name: 'technologies', label: 'Technologies', type: 'textarea', rows: 2, list: true, hint: 'Separate entries with commas.' },
      { name: 'githubUrl', label: 'GitHub URL', type: 'url' },
      { name: 'liveUrl', label: 'Live URL', type: 'url' },
      { name: 'linkedinUrl', label: 'LinkedIn URL', type: 'url' },
      { name: 'coverImageId', label: 'Cover image', type: 'media', hint: 'You can also mark a gallery image as the cover.' },
      { name: 'displayOrder', label: 'Display order', type: 'number', min: 0 },
      { name: 'featured', label: 'Featured', type: 'checkbox' },
      { name: 'active', label: 'Active', type: 'checkbox', defaultValue: true },
    ],
    columns: [
      { key: 'title', label: 'Hackathon', strong: true },
      { key: 'result', label: 'Result' },
      { key: 'projectName', label: 'Project' },
      { key: 'gallery', label: 'Images', type: 'count' },
      { key: 'featured', label: 'Featured', type: 'boolean' },
      { key: 'active', label: 'Active', type: 'boolean' },
      { key: 'displayOrder', label: 'Order' },
    ],
  },
  blogs: {
    key: 'blogs', title: 'Blogs', singular: 'article', description: 'Write and publish portfolio articles.', api: blogsApi,
    schema: z.object({ title: requiredText('Title'), slug, excerpt: text(1000).nullable().optional(), content: requiredText('Content', 200000), coverImageId: z.string().uuid('Enter a valid media ID.').or(z.literal('')).nullable().optional(), published: z.boolean().optional(), publishedAt: z.string().optional() }),
    fields: [
      { name: 'title', label: 'Title', required: true }, slugField, { name: 'excerpt', label: 'Excerpt', type: 'textarea', rows: 3 },
      { name: 'content', label: 'Content', type: 'textarea', rows: 8, required: true }, { name: 'coverImageId', label: 'Cover image', type: 'media' },
      { name: 'publishedAt', label: 'Publish date', type: 'datetime' }, { name: 'published', label: 'Published', type: 'checkbox' },
    ],
    columns: [{ key: 'title', label: 'Article', strong: true }, { key: 'slug', label: 'Slug' }, { key: 'published', label: 'Published', type: 'boolean' }, { key: 'publishedAt', label: 'Published date', type: 'date' }],
  },
  experience: {
    key: 'experience', title: 'Experience', singular: 'experience record', description: 'Maintain the roles and milestones in your career history.', api: experienceApi,
    schema: z.object({ company: requiredText('Company'), role: requiredText('Role'), location: text().nullable().optional(), employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP']).optional(), startDate: z.string().optional(), endDate: z.string().optional(), current: z.boolean().optional(), description: text(5000).nullable().optional(), displayOrder: numberField(0).optional() }),
    fields: [
      { name: 'company', label: 'Company', required: true }, { name: 'role', label: 'Role', required: true }, { name: 'location', label: 'Location' },
      { name: 'employmentType', label: 'Employment type', type: 'select', defaultValue: 'FULL_TIME', options: [['FULL_TIME', 'Full-time'], ['PART_TIME', 'Part-time'], ['CONTRACT', 'Contract'], ['FREELANCE', 'Freelance'], ['INTERNSHIP', 'Internship']] },
      { name: 'startDate', label: 'Start date', type: 'datetime' }, { name: 'endDate', label: 'End date', type: 'datetime' },
      { name: 'description', label: 'Description', type: 'textarea', rows: 4 }, { name: 'displayOrder', label: 'Display order', type: 'number', min: 0 },
      { name: 'current', label: 'Current role', type: 'checkbox' },
    ],
    columns: [{ key: 'role', label: 'Role', strong: true }, { key: 'company', label: 'Company' }, { key: 'employmentType', label: 'Type' }, { key: 'startDate', label: 'Start date', type: 'date' }, { key: 'current', label: 'Current', type: 'boolean' }],
  },
  testimonials: {
    key: 'testimonials', title: 'Testimonials', singular: 'testimonial', description: 'Manage client feedback and attribution.', api: testimonialsApi,
    schema: z.object({ name: requiredText('Author', 120), role: text(120).nullable().optional(), company: text(120).nullable().optional(), content: requiredText('Content', 5000), avatarImageId: z.string().uuid('Enter a valid media ID.').or(z.literal('')).nullable().optional(), published: z.boolean().optional(), displayOrder: numberField(0).optional() }),
    fields: [
      { name: 'name', label: 'Author', required: true }, { name: 'role', label: 'Role' }, { name: 'company', label: 'Company' },
      { name: 'content', label: 'Content', type: 'textarea', rows: 5, required: true }, { name: 'avatarImageId', label: 'Avatar image', type: 'media' },
      { name: 'displayOrder', label: 'Display order', type: 'number', min: 0 }, { name: 'published', label: 'Published', type: 'checkbox' },
    ],
    columns: [{ key: 'name', label: 'Author', strong: true }, { key: 'role', label: 'Role' }, { key: 'company', label: 'Company' }, { key: 'published', label: 'Published', type: 'boolean' }, { key: 'displayOrder', label: 'Order' }],
  },
  services: {
    key: 'services', title: 'Services', singular: 'service', description: 'Describe the services available through your portfolio.', api: servicesApi,
    schema: z.object({ title: requiredText('Title'), slug, description: text(2000).nullable().optional(), icon: text(200).nullable().optional(), displayOrder: numberField(0).optional(), active: z.boolean().optional() }),
    fields: [
      { name: 'title', label: 'Title', required: true }, slugField, { name: 'description', label: 'Description', type: 'textarea', rows: 4 },
      { name: 'icon', label: 'Icon name' }, { name: 'displayOrder', label: 'Display order', type: 'number', min: 0 }, { name: 'active', label: 'Active', type: 'checkbox', defaultValue: true },
    ],
    columns: [{ key: 'title', label: 'Service', strong: true }, { key: 'slug', label: 'Slug' }, { key: 'active', label: 'Status', type: 'boolean' }, { key: 'displayOrder', label: 'Order' }],
  },
}