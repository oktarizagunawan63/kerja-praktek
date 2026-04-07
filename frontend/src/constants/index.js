// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3
}

// Application Constants
export const APP_CONFIG = {
  NAME: 'PT Amsar Dashboard',
  VERSION: '1.0.0',
  STORAGE_KEYS: {
    AUTH: 'amsar-auth',
    APP_DATA: 'amsar-app',
    USER_DATA: 'amsar-users'
  }
}

// Project Status
export const PROJECT_STATUS = {
  ON_TRACK: 'on_track',
  AT_RISK: 'at_risk', 
  DELAYED: 'delayed',
  COMPLETED: 'completed'
}

export const STATUS_CONFIG = {
  [PROJECT_STATUS.ON_TRACK]: { 
    label: 'On Track', 
    variant: 'success',
    color: '#16a34a'
  },
  [PROJECT_STATUS.AT_RISK]: { 
    label: 'At Risk', 
    variant: 'warning',
    color: '#ea580c'
  },
  [PROJECT_STATUS.DELAYED]: { 
    label: 'Delayed', 
    variant: 'danger',
    color: '#dc2626'
  },
  [PROJECT_STATUS.COMPLETED]: { 
    label: 'Selesai', 
    variant: 'info',
    color: '#0ea5e9'
  }
}

// User Roles
export const USER_ROLES = {
  DIRECTOR: 'direktur',
  DIRECTOR_ALT: 'director', // For backward compatibility
  SITE_MANAGER: 'site_manager',
  PROJECT_MANAGER: 'project_manager', // Legacy role, treat as site_manager
  ENGINEER: 'engineer',
  SALES: 'sales'
}

// Visit Management
export const VISIT_STATUS = {
  PENDING: 'pending',
  DONE: 'done',
  MISSED: 'missed'
}

export const VISIT_STATUS_CONFIG = {
  [VISIT_STATUS.PENDING]: {
    label: 'Pending',
    variant: 'warning',
    color: '#ea580c'
  },
  [VISIT_STATUS.DONE]: {
    label: 'Selesai',
    variant: 'success',
    color: '#16a34a'
  },
  [VISIT_STATUS.MISSED]: {
    label: 'Terlewat',
    variant: 'danger',
    color: '#dc2626'
  }
}

// Warning Types
export const WARNING_TYPES = {
  MISSED_VISIT: 'missed_visit',
  LATE_ATTENDANCE: 'late_attendance',
  NO_ATTENDANCE: 'no_attendance'
}

export const WARNING_TYPE_CONFIG = {
  [WARNING_TYPES.MISSED_VISIT]: {
    label: 'Visit Terlewat',
    icon: '📅',
    color: '#dc2626'
  },
  [WARNING_TYPES.LATE_ATTENDANCE]: {
    label: 'Terlambat Absen',
    icon: '⏰',
    color: '#ea580c'
  },
  [WARNING_TYPES.NO_ATTENDANCE]: {
    label: 'Tidak Absen',
    icon: '❌',
    color: '#dc2626'
  }
}

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  OVER_BUDGET: 'over_budget',
  DEADLINE_WARNING: 'deadline_warning'
}

// Form Validation
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Field ini wajib diisi',
  EMAIL_INVALID: 'Format email tidak valid',
  PASSWORD_MIN: 'Password minimal 6 karakter',
  PHONE_INVALID: 'Format nomor telepon tidak valid',
  NUMBER_INVALID: 'Harus berupa angka',
  DATE_INVALID: 'Format tanggal tidak valid'
}

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  INPUT: 'yyyy-MM-dd',
  DATETIME: 'dd/MM/yyyy HH:mm',
  API: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'
}

// File Upload
export const FILE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    SPREADSHEETS: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  }
}

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100]
}

// Theme Colors
export const THEME = {
  PRIMARY: '#0f4c81',
  PRIMARY_HOVER: '#1a6bb5',
  SUCCESS: '#16a34a',
  WARNING: '#ea580c',
  ERROR: '#dc2626',
  INFO: '#0ea5e9',
  GRAY: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
}