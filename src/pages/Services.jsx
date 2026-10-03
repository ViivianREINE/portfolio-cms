import ResourcePage from './ResourcePage'
import { resourceDefinitions } from './resourceDefinitions'

export default function Services() {
  return <ResourcePage config={resourceDefinitions.services} />
}