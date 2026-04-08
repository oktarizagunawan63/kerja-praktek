/**
 * Role-based permission helper
 * roles: 'administrator' | 'sales_manager' | 'engineer' | 'sales'
 */

export const can = (user, action) => {
  if (!user) return false
  
  const role = user.role
  
  // ADMINISTRATOR gets ALL permissions
  if (role === 'administrator' || role === 'Administrator' || role === 'direktur' || role === 'Direktur' || role === 'director' || role === 'Director') {
    return true  // ADMINISTRATOR can do EVERYTHING
  }

  const rules = {
    // Visit Management
    access_visit_management: ['sales_manager', 'sales'],
    
    // Customer Management
    create_customer:  ['sales_manager', 'sales'],
    edit_customer:    ['sales_manager', 'sales'],
    delete_customer:  ['sales_manager'],
    view_all_customers: ['sales_manager'],
    
    // Plan Visit Management
    create_plan_visit: ['sales_manager', 'sales'],
    edit_plan_visit:   ['sales_manager', 'sales'],
    delete_plan_visit: ['sales_manager'],
    assign_visits:     ['sales_manager'],
    view_all_plan_visits: ['sales_manager'],
    
    // Realisasi Visit
    create_realisasi_visit: ['sales'],
    view_realisasi_visits: ['sales_manager', 'sales'],
    mark_visit_missed: ['sales'],
    
    // Attendance
    manage_attendance: ['sales'],
    view_all_attendance: ['sales_manager'],
    
    // Warnings
    view_all_warnings: ['sales_manager'],
    manage_warnings:   ['sales_manager'],
    
    // Reports
    view_visit_reports: ['sales_manager', 'sales'],
    view_sales_performance: ['sales_manager'],
    export_reports: ['sales_manager'],
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
  if (user.role === 'administrator' || user.role === 'direktur' || user.role === 'director') return projects

  const freshUser = allUsers.find(u => u.email === user.email) || user
  const assigned = (freshUser.assignedProjects || []).map(String)

  if (user.role === 'sales_manager' || user.role === 'site_manager' || user.role === 'project_manager') {
    // Sales manager/Project manager: proyek yang di-assign manual ATAU proyek yang dia buat (PM = namanya)
    return projects.filter(p =>
      assigned.includes(String(p.id)) ||
      p.pm?.toLowerCase() === user.name?.toLowerCase()
    )
  }

  if (user.role === 'engineer') {
    // Engineer: HANYA proyek yang di-assign manual oleh administrator/sales manager
    return projects.filter(p => assigned.includes(String(p.id)))
  }

  return []
}
