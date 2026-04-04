import { USER_ROLES } from '../constants'

/**
 * Utility functions for handling user roles
 */

// Normalize role names for consistency
export function normalizeRole(role) {
  const roleMap = {
    'director': USER_ROLES.DIRECTOR,
    'project_manager': USER_ROLES.SITE_MANAGER,
    'site_manager': USER_ROLES.SITE_MANAGER,
    'engineer': USER_ROLES.ENGINEER,
    'direktur': USER_ROLES.DIRECTOR
  }
  
  return roleMap[role] || role
}

// Check if user is director (any variant)
export function isDirector(user) {
  if (!user?.role) return false
  const role = normalizeRole(user.role)
  return role === USER_ROLES.DIRECTOR
}

// Check if user is site manager (any variant)
export function isSiteManager(user) {
  if (!user?.role) return false
  const role = normalizeRole(user.role)
  return role === USER_ROLES.SITE_MANAGER
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
    [USER_ROLES.DIRECTOR]: 'Direktur',
    [USER_ROLES.SITE_MANAGER]: 'Site Manager',
    [USER_ROLES.ENGINEER]: 'Engineer'
  }
  
  const normalizedRole = normalizeRole(role)
  return displayNames[normalizedRole] || role
}

// Get role permissions level (higher = more permissions)
export function getRoleLevel(role) {
  const levels = {
    [USER_ROLES.DIRECTOR]: 3,
    [USER_ROLES.SITE_MANAGER]: 2,
    [USER_ROLES.ENGINEER]: 1
  }
  
  const normalizedRole = normalizeRole(role)
  return levels[normalizedRole] || 0
}

// Check if user has higher or equal role level
export function hasRoleLevel(user, requiredLevel) {
  if (!user?.role) return false
  return getRoleLevel(user.role) >= requiredLevel
}