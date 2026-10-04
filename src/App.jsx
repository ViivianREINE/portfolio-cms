import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import About from './pages/About'
import Achievements from './pages/Achievements'
import Blogs from './pages/Blogs'
import Dashboard from './pages/Dashboard'
import Experience from './pages/Experience'
import Login from './pages/Login'
import Media from './pages/Media'
import Messages from './pages/Messages'
import Projects from './pages/Projects'
import Services from './pages/Services'
import Skills from './pages/Skills'
import Testimonials from './pages/Testimonials'
import ProtectedRoute from './routes/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/services" element={<Services />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/media" element={<Media />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
