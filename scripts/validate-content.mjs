import { auditContent, loadContent } from './content-common.mjs'

const content = loadContent()
const errors = auditContent(content)
const featured = (content.projects || []).filter((project) => project.featured && project.published).map((project) => project.title)

console.log('Content ownership')
for (const [section, note] of Object.entries(content.ownership || {})) {
  console.log(`- ${section}: ${note}`)
}
console.log('')
console.log(`Skills ${content.skills?.length || 0}`)
console.log(`Experience ${content.experience?.length || 0}`)
console.log(`Projects ${content.projects?.length || 0}`)
console.log(`Featured ${featured.join(' | ')}`)
console.log(`Achievements ${content.about?.profileData?.achievements?.length || 0}`)
console.log(`Volunteering ${content.about?.profileData?.volunteering?.length || 0}`)

if (errors.length) {
  console.error('\nDuplication audit failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('\nDuplication audit passed.')
