import ResourcePage from './ResourcePage'
import { resourceDefinitions } from './resourceDefinitions'

export default function Blogs() {
  return <ResourcePage config={resourceDefinitions.blogs} />
}