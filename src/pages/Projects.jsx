import ResourcePage from './ResourcePage'
import { resourceDefinitions } from './resourceDefinitions'

export default function Projects() {
  return <ResourcePage config={resourceDefinitions.projects} />
}