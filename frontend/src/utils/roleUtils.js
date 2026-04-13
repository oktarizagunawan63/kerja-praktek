/**
 * Utility functions for handling user roles
 */

// Normalize role names for consistency
export function normalizeRole(role) {
  if (!role) return null
  
  const roleMap = {
    'director': 'administrator',
    'direktur': 'administrator',
    'Direktur': 'administrator',
    'administrator': 'administrator',
    'Administrator': 'administrator',
    'Director': 'administrator',
    'project_manager': 'site_manager',
    'site_manager': 'site_manager',
    'Site Manager': 'site_manager',
    'sales_manager': 'sales_manager',
    'Sales Manager': 'sales_manager',
    'engineer': 'engineer',
    'Engineer': 'engineer',
    'sales': 'sales',
    'Sales': 'sales'
  }
  
  return roleMap[role] || role.toLowerCase()
}

// Check if user is administrator (any variant) - SIMPLE VERSION
export function isAdministrator(user) {
  if (!user?.role) return false
  
  // Direct check for all administrator variants
  const administratorRoles = ['administrator', 'direktur', 'director', 'Administrator', 'Direktur', 'Director']
  return administratorRoles.includes(user.role)
}

// Check if user is sales manager (any variant)
export function isSalesManager(user) {
  if (!user?.role) return false
  const role = normalizeRole(user.role)
  return role === 'sales_manager'
}

// Check if user is site manager
export function isSiteManager(user) {
  if (!user?.role) return false
  const role = normalizeRole(user.role)
  return role === 'site_manager'
}

// Check if user is engineer
export function isEngineer(user) {
  if (!user?.role) return false
  const role = normalizeRole(user.role)
  return role === 'engineer'
}

// Check if user is sales
export function isSales(user) {
  if (!user?.role) return false
  const role = normalizeRole(user.role)
  return role === 'sales'
}

// Get role display name
export function getRoleDisplayName(role) {
  const displayNames = {
    'administrator': 'Administrator',
    'direktur': 'Administrator',
    'director': 'Administrator',
    'sales_manager': 'Sales Manager',
    'site_manager': 'Site Manager',
    'project_manager': 'Site Manager',
    'engineer': 'Engineer',
    'sales': 'Sales'
  }
  
  return displayNames[role] || role || 'Unknown'
}