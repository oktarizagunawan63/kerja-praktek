/**
 * Role-based permission helper
 * STANDARDIZED ROLES: 'administrator' | 'site_manager' | 'engineer' | 'sales_manager' | 'sales'
 */

// Normalize role to handle legacy role names
const normalizeRole = (role) => {
  if (!role) return null
  
  const roleMap = {
    'direktur': 'administrator',
    'Direktur': 'administrator', 
    'director': 'administrator',
    'Director': 'administrator',
    'Administrator': 'administrator',
    'site_manager': 'site_manager', // Keep site_manager for project management
    'project_manager': 'site_manager',
    'sales_manager': 'sales_manager',
    'sales': 'sales',
    'engineer': 'engineer'
  }
  
  return roleMap[role] || role.toLowerCase()
}

export const can = (user, action) => {
  if (!user) return false
  
  const role = normalizeRole(user.role)
  
  // ADMINISTRATOR gets ALL permissions
  if (role === 'administrator') {
    return true  // ADMINISTRATOR can do EVERYTHING
  }

  const rules = {
    // Project Management - Site Manager handles construction projects
    create_project:   ['administrator', 'site_manager'],
    edit_project:     ['administrator', 'site_manager'],
    delete_project:   ['administrator', 'site_manager'],
    mark_complete:    ['administrator', 'site_manager'],
    view_all_projects: ['administrator', 'site_manager'],
    assign_project:   ['administrator', 'site_manager'], // Site manager assigns to engineers
    
    // Visit Management - Sales Manager handles visits and sales
    access_visit_management: ['administrator', 'sales_manager', 'sales'],
    
    // Customer Management
    create_customer:  ['administrator', 'sales_manager', 'sales'],
    edit_customer:    ['administrator', 'sales_manager', 'sales'],
    delete_customer:  ['administrator', 'sales_manager'],
    view_all_customers: ['administrator', 'sales_manager'],
    
    // Plan Visit Management
    create_plan_visit: ['administrator', 'sales_manager', 'sales'],
    edit_plan_visit:   ['administrator', 'sales_manager', 'sales'],
    delete_plan_visit: ['administrator', 'sales_manager'],
    assign_visits:     ['administrator', 'sales_manager'],
    view_all_plan_visits: ['administrator', 'sales_manager'],
    
    // Realisasi Visit
    create_realisasi_visit: ['administrator', 'sales_manager', 'sales'],
    view_realisasi_visits: ['administrator', 'sales_manager', 'sales'],
    mark_visit_missed: ['administrator', 'sales_manager', 'sales'],
    
    // Attendance
    manage_attendance: ['administrator', 'sales_manager', 'sales'],
    view_all_attendance: ['administrator', 'sales_manager'],
    monitor_attendance: ['administrator'], // Only admin can monitor all attendance
    
    // Warnings
    view_all_warnings: ['administrator', 'sales_manager'],
    manage_warnings:   ['administrator', 'sales_manager'],
    
    // Reports
    view_visit_reports: ['administrator', 'sales_manager', 'sales'],
    view_sales_performance: ['administrator', 'sales_manager'],
    export_reports: ['administrator', 'sales_manager'],
    
    // User Management
    manage_users: ['administrator'],
    view_activity_log: ['administrator'],
    
    // Site Management (Construction Projects)
    manage_site_projects: ['administrator', 'site_manager'],
    assign_engineers: ['administrator', 'site_manager'],
  }

  return rules[action]?.includes(role) ?? false
}

/**
 * Filter proyek berdasarkan role & assigned projects
 */
export const filterProjectsByRole = (projects, user, allUsers = []) => {
  if (!user) return []
  
  const role = normalizeRole(user.role)
  
  // Administrator lihat semua proyek
  if (role === 'administrator') {
    return projects
  }

  // Site Manager lihat semua proyek (mereka yang manage construction projects)
  if (role === 'site_manager') {
    return projects
  }

  // Engineer hanya lihat proyek yang di-assign ke mereka
  if (role === 'engineer') {
    const freshUser = allUsers.find(u => u.email === user.email) || user
    const assigned = (freshUser.assignedProjects || []).map(String)
    return projects.filter(p => assigned.includes(String(p.id)))
  }

  // Sales Manager dan Sales tidak lihat construction projects (mereka fokus visit management)
  if (role === 'sales_manager' || role === 'sales') {
    return [] // Sales team tidak handle construction projects
  }

  return []
}

// Helper function to check if user is administrator
export const isAdministrator = (user) => {
  if (!user) return false
  return normalizeRole(user.role) === 'administrator'
}

// Helper function to check if user can access visit management
export const canAccessVisitManagement = (user) => {
  if (!user) return false
  const role = normalizeRole(user.role)
  return ['administrator', 'sales_manager', 'sales'].includes(role)
}

// Helper function to check if user can manage construction projects
export const canManageProjects = (user) => {
  if (!user) return false
  const role = normalizeRole(user.role)
  return ['administrator', 'site_manager'].includes(role)
}
