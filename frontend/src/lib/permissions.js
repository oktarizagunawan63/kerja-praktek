/**
 * Role-based permission helper
 * roles: 'direktur' | 'site_manager' | 'engineer'
 */

export const can = (user, action) => {
  if (!user) return false
  const role = user.role

  const rules = {
    // Proyek
    create_project:   ['direktur', 'site_manager'],
    delete_project:   ['direktur'],
    edit_project:     ['direktur', 'site_manager'],
    mark_complete:    ['direktur', 'site_manager'],

    // Material
    add_material:     ['direktur', 'site_manager'],
    update_material:  ['direktur', 'site_manager', 'engineer'],
    delete_material:  ['direktur', 'site_manager'],

    // Dokumen
    upload_doc:       ['direktur', 'site_manager', 'engineer'],
    delete_doc:       ['direktur', 'site_manager'],

    // RAB
    edit_rab:         ['direktur', 'site_manager'],

    // Laporan
    export_pdf:       ['direktur', 'site_manager'],

    // User management
    manage_users:     ['direktur'],

    // Activity log
    view_activity:    ['direktur'],
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
  if (user.role === 'direktur') return projects

  const freshUser = allUsers.find(u => u.email === user.email) || user
  const assigned = (freshUser.assignedProjects || []).map(String)

  if (user.role === 'site_manager') {
    // Site manager: proyek yang di-assign manual ATAU proyek yang dia buat (PM = namanya)
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
