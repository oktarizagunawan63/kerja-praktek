import { USER_ROLES } from '../constants'

/**
 * Utility functions for handling user roles
 */

// Normalize role names for consistency
export function normalizeRole(role) {
  if (!role) return null
  
  const roleMap = {
    'director': USER_ROLES.ADMINISTRATOR,
    'direktur': USER_ROLES.ADMINISTRATOR,
    'Direktur': USER_ROLES.ADMINISTRATOR,
    'administrator': USER_ROLES.ADMINISTRATOR,
    'Administrator': USER_ROLES.ADMINISTRATOR,
    'Director': USER_ROLES.ADMINISTRATOR,
    'project_manager': USER_ROLES.SALES_MANAGER,
    'site_manager': USER_ROLES.SALES_MANAGER,
    'Site Manager': USER_ROLES.SALES_MANAGER,
    'sales_manager': USER_ROLES.SALES_MANAGER,
    'Sales Manager': USER_ROLES.SALES_MANAGER,
    'engineer': USER_ROLES.ENGINEER,
    'Engineer': USER_ROLES.ENGINEER,
    'sales': USER_ROLES.SALES,
    'Sales': USER_ROLES.SALES
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
  return role === USER_ROLES.SALES_MANAGER
}

// Check if user is engineer
export function isEngineer(user) {
  if (!user?.role) return false
  const role = normalizeRole(user.role)
  return role === USER_ROLES.ENGINEER
}

// Get role display name
export function getRoleDisplayName(role) {
  const displayNames = {
    [USER_ROLES.ADMINISTRATOR]: 'Administrator',
    [USER_ROLES.SALES_MANAGER]: 'Sales Manager',
    [USER_ROLES.ENGINEER]: 'Engineer',
    [USER_ROLES.SALES]: 'Sales'
  }
  
  const normalizedRole = normalizeRole(role)
  return displayNames[normalizedRole] || role
}

// Get role permissions level (higher = more permissions)
export function getRoleLevel(role) {
  const levels = {
    [USER_ROLES.ADMINISTRATOR]: 3,
    [USER_ROLES.SALES_MANAGER]: 2,
    [USER_ROLES.ENGINEER]: 1,
    [USER_ROLES.SALES]: 1
  }
  
  const normalizedRole = normalizeRole(role)
  return levels[normalizedRole] || 0
}

// Check if user has higher or equal role level
export function hasRoleLevel(user, requiredLevel) {
  if (!user?.role) return false
  return getRoleLevel(user.role) >= requiredLevel
}