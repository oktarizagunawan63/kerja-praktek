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
    // Project Management
    create_project:   ['administrator', 'sales_manager', 'site_manager'],
    edit_project:     ['administrator', 'sales_manager', 'site_manager'],
    delete_project:   ['administrator', 'sales_manager'],
    mark_complete:    ['administrator', 'sales_manager', 'site_manager'],
    view_all_projects: ['administrator', 'sales_manager', 'site_manager'],
    
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
  
  // Administrator lihat semua proyek
  if (user.role === 'administrator' || user.role === 'direktur' || user.role === 'director') {
    return projects
  }

  // Site Manager & Sales Manager lihat semua proyek (mereka yang manage proyek)
  if (user.role === 'sales_manager' || user.role === 'site_manager') {
    return projects
  }

  // Engineer hanya lihat proyek yang di-assign ke mereka
  if (user.role === 'engineer') {
    const freshUser = allUsers.find(u => u.email === user.email) || user
    const assigned = (freshUser.assignedProjects || []).map(String)
    return projects.filter(p => assigned.includes(String(p.id)))
  }

  // Sales hanya lihat proyek yang di-assign ke mereka (untuk visit management)
  if (user.role === 'sales') {
    const freshUser = allUsers.find(u => u.email === user.email) || user
    const assigned = (freshUser.assignedProjects || []).map(String)
    return projects.filter(p => assigned.includes(String(p.id)))
  }

  return []
}
