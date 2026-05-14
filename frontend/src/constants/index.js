import { Clock, CircleX, FileText } from '@icons'

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
    color: '#5a9844'
  },
  [PROJECT_STATUS.AT_RISK]: { 
    label: 'At Risk', 
    variant: 'warning',
    color: '#8ac04a'
  },
  [PROJECT_STATUS.DELAYED]: { 
    label: 'Delayed', 
    variant: 'danger',
    color: '#d54496'
  },
  [PROJECT_STATUS.COMPLETED]: { 
    label: 'Selesai', 
    variant: 'info',
    color: '#237043'
  }
}

// User Roles
export const USER_ROLES = {
  ADMINISTRATOR: 'administrator',
  DIRECTOR_ALT: 'director', // For backward compatibility
  SALES_MANAGER: 'sales_manager',
  PROJECT_MANAGER: 'project_manager', // Legacy role, treat as sales_manager
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
    color: '#8ac04a'
  },
  [VISIT_STATUS.DONE]: {
    label: 'Selesai',
    variant: 'success',
    color: '#5a9844'
  },
  [VISIT_STATUS.MISSED]: {
    label: 'Terlewat',
    variant: 'danger',
    color: '#d54496'
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
    icon: FileText,
    color: '#d54496'
  },
  [WARNING_TYPES.LATE_ATTENDANCE]: {
    label: 'Terlambat Absen',
    icon: Clock,
    color: '#8ac04a'
  },
  [WARNING_TYPES.NO_ATTENDANCE]: {
    label: 'Tidak Absen',
    icon: CircleX,
    color: '#d54496'
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
  PRIMARY: '#237043',
  PRIMARY_HOVER: '#5a9844',
  SUCCESS: '#5a9844',
  WARNING: '#8ac04a',
  ERROR: '#d54496',
  INFO: '#de168c',
  GRAY: {
    50: '#f3faf1',
    100: '#b7cdc0',
    200: '#a4ca9a',
    300: '#a4ca9a',
    400: '#5a9844',
    500: '#5a9844',
    600: '#237043',
    700: '#237043',
    800: '#237043',
    900: '#237043'
  }
}
