import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import useAuthStore from './store/authStore'
import { isAdministrator } from './utils/roleUtils'
import { can } from './lib/permissions'
import { clearErrorNotifications } from './utils/clearErrorNotifications'
import DashboardLayout from './layouts/DashboardLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import SalesManagerDashboard from './pages/SalesManagerDashboard'
import SalesDashboard from './pages/SalesDashboard'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import DocumentsPage from './pages/DocumentsPage'
import ReportsPage from './pages/ReportsPage'
import ActivityLogPage from './pages/ActivityLogPage'
import NotificationsPage from './pages/NotificationsPage'
import UsersPage from './pages/UsersPage'
import UserApprovalsPage from './pages/UserApprovalsPage'
// Visit Management Pages
import CustomersPage from './pages/CustomersPage'
import PlanVisitsPage from './pages/PlanVisitsPage'
import RealisasiVisitsPage from './pages/RealisasiVisitsPage'
import AttendancePage from './pages/AttendancePage'
import VisitReportsPage from './pages/VisitReportsPage'
import WarningsPage from './pages/WarningsPage'
import WelcomeModal from './components/ui/WelcomeModal'
import './styles/animations.css'

function PrivateRoute({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" replace />
}

function AdministratorOnly({ children }) {
  const { user } = useAuthStore()
  if (!isAdministrator(user)) return <Navigate to="/dashboard" replace />
  return children
}

function VisitManagementOnly({ children }) {
  const { user } = useAuthStore()
  if (!can(user, 'access_visit_management')) return <Navigate to="/dashboard" replace />
  return children
}

function RoleBasedDashboardRedirect() {
  const { user } = useAuthStore()
  
  if (user?.role === 'sales_manager') {
    return <Navigate to="/manager/dashboard" replace />
  } else if (user?.role === 'sales') {
    return <Navigate to="/sales/dashboard" replace />
  } else {
    return <DashboardPage />
  }
}

export default function App() {
  const { user } = useAuthStore()
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)

  // Clear error notifications on app start
  useEffect(() => {
    clearErrorNotifications()
  }, [])

  // Check if user is new and should see welcome modal
  useEffect(() => {
    if (user && user.status === 'approved') {
      // Check if user hasn't seen welcome before
      const hasSeenWelcome = localStorage.getItem(`welcome-seen-${user.id}`)
      
      if (!hasSeenWelcome) {
        // Check if user is recently approved (within last 7 days for testing)
        const approvedAt = new Date(user.approved_at || user.created_at)
        const now = new Date()
        const daysDiff = (now - approvedAt) / (1000 * 60 * 60 * 24)
        
        if (daysDiff <= 7) {
          setShowWelcomeModal(true)
        }
      }
    }
  }, [user])

  const handleWelcomeClose = () => {
    setShowWelcomeModal(false)
    // Mark as seen so it doesn't show again
    if (user) {
      localStorage.setItem(`welcome-seen-${user.id}`, 'true')
    }
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontSize: '13px',
            padding: '10px 14px',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxWidth: '320px',
          },
          success: {
            iconTheme: { primary: '#16a34a', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#fff' },
          },
          duration: 3000,
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"        element={<RoleBasedDashboardRedirect />} />
          
          {/* Role-based Dashboards */}
          <Route path="manager/dashboard" element={<SalesManagerDashboard />} />
          <Route path="sales/dashboard"   element={<SalesDashboard />} />
          
          <Route path="projects"         element={<ProjectsPage />} />
          <Route path="projects/:id"     element={<ProjectDetailPage />} />
          <Route path="documents"        element={<DocumentsPage />} />
          <Route path="reports"          element={<ReportsPage />} />
          <Route path="notifications"    element={<NotificationsPage />} />
          <Route path="activity"         element={<AdministratorOnly><ActivityLogPage /></AdministratorOnly>} />
          <Route path="users"            element={<AdministratorOnly><UsersPage /></AdministratorOnly>} />
          <Route path="user-approvals"   element={<AdministratorOnly><UserApprovalsPage /></AdministratorOnly>} />
          
          {/* Visit Management Routes */}
          <Route path="customers"        element={<VisitManagementOnly><CustomersPage /></VisitManagementOnly>} />
          <Route path="plan-visits"      element={<VisitManagementOnly><PlanVisitsPage /></VisitManagementOnly>} />
          <Route path="realisasi-visits" element={<VisitManagementOnly><RealisasiVisitsPage /></VisitManagementOnly>} />
          <Route path="attendance"       element={<VisitManagementOnly><AttendancePage /></VisitManagementOnly>} />
          <Route path="visit-reports"    element={<VisitManagementOnly><VisitReportsPage /></VisitManagementOnly>} />
          <Route path="warnings"         element={<VisitManagementOnly><WarningsPage /></VisitManagementOnly>} />
        </Route>
      </Routes>

      {/* Welcome Modal for New Users */}
      <WelcomeModal
        open={showWelcomeModal}
        onClose={handleWelcomeClose}
        user={user}
      />
    </>
  )
}
