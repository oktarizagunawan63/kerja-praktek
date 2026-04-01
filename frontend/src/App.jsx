import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'
import DashboardLayout from './layouts/DashboardLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import DocumentsPage from './pages/DocumentsPage'
import ReportsPage from './pages/ReportsPage'
import ActivityLogPage from './pages/ActivityLogPage'
import NotificationsPage from './pages/NotificationsPage'
import UsersPage from './pages/UsersPage'

function PrivateRoute({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" replace />
}

function DirectorOnly({ children }) {
  const { user } = useAuthStore()
  if (user?.role !== 'direktur') return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"        element={<DashboardPage />} />
          <Route path="projects"         element={<ProjectsPage />} />
          <Route path="projects/:id"     element={<ProjectDetailPage />} />
          <Route path="documents"        element={<DocumentsPage />} />
          <Route path="reports"          element={<ReportsPage />} />
          <Route path="notifications"    element={<NotificationsPage />} />
          <Route path="activity"         element={<DirectorOnly><ActivityLogPage /></DirectorOnly>} />
          <Route path="users"            element={<DirectorOnly><UsersPage /></DirectorOnly>} />
        </Route>
      </Routes>
    </>
  )
}
