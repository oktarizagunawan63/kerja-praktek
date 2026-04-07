/**
 * Role-based permission helper
 * roles: 'direktur' | 'site_manager' | 'engineer' | 'sales'
 */

export const can = (user, action) => {
  if (!user) return false
  
  const role = user.role
  
  // DIREKTUR gets ALL permissions
  if (role === 'direktur' || role === 'Direktur' || role === 'director' || role === 'Director') {
    return true  // DIREKTUR can do EVERYTHING
  }

  const rules = {
    // Visit Management
    access_visit_management: ['site_manager', 'sales'],
    
    // Customer Management
    create_customer:  ['site_manager', 'sales'],
    edit_customer:    ['site_manager', 'sales'],
    delete_customer:  ['site_manager'],
    view_all_customers: ['site_manager'],
    
    // Plan Visit Management
    create_plan_visit: ['site_manager', 'sales'],
    edit_plan_visit:   ['site_manager', 'sales'],
    delete_plan_visit: ['site_manager'],
    assign_visits:     ['site_manager'],
    view_all_plan_visits: ['site_manager'],
    
    // Realisasi Visit
    create_realisasi_visit: ['sales'],
    view_realisasi_visits: ['site_manager', 'sales'],
    mark_visit_missed: ['sales'],
    
    // Attendance
    manage_attendance: ['sales'],
    view_all_attendance: ['site_manager'],
    
    // Warnings
    view_all_warnings: ['site_manager'],
    manage_warnings:   ['site_manager'],
    
    // Reports
    view_visit_reports: ['site_manager', 'sales'],
    view_sales_performance: ['site_manager'],
    export_reports: ['site_manager'],
  }

  return rules[action]?.includes(role) ?? false
}

/**
 * Filter proyek berdasarkan role & assigned projects
 * Ambil assignedProjects dari userStore (bukan dari authStore)
 * karena authStore menyimpan snapshot saat login
 */
export const filterProjectsByRole = (projects, user, allUsers = []) => {
  if (!user) return []
  if (user.role === 'direktur' || user.role === 'director') return projects

  const freshUser = allUsers.find(u => u.email === user.email) || user
  const assigned = (freshUser.assignedProjects || []).map(String)

  if (user.role === 'site_manager' || user.role === 'project_manager') {
    // Site manager/Project manager: proyek yang di-assign manual ATAU proyek yang dia buat (PM = namanya)
    return projects.filter(p =>
      assigned.includes(String(p.id)) ||
      p.pm?.toLowerCase() === user.name?.toLowerCase()
    )
  }

  if (user.role === 'engineer') {
    // Engineer: HANYA proyek yang di-assign manual oleh direktur/site manager
    return projects.filter(p => assigned.includes(String(p.id)))
  }

  return []
}
