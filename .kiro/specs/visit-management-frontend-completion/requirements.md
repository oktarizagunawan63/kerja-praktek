# Requirements Document

## Introduction

Sistem visit management backend sudah 100% selesai dengan semua API, controller, dan model yang diperlukan. Multi-role login sudah berfungsi dengan Site Manager dashboard (hijau) dan Sales dashboard (merah). Customer management page sudah selesai dan direktur account sudah berfungsi sempurna. 

Dokumen ini mendefinisikan requirements untuk menyelesaikan halaman-halaman frontend visit management yang masih kurang, yaitu: Plan Visit Management, Realisasi Visit, Attendance, Visit Reports, dan Warnings.

## Glossary

- **Visit_Management_System**: Sistem manajemen kunjungan sales ke customer
- **Plan_Visit_Page**: Halaman untuk mengelola rencana kunjungan
- **Realisasi_Visit_Page**: Halaman untuk melakukan realisasi kunjungan dengan GPS tracking
- **Attendance_Page**: Halaman untuk check-in/check-out dengan GPS
- **Visit_Reports_Page**: Dashboard laporan kunjungan dengan filter
- **Warnings_Page**: Halaman untuk melihat warning notifications
- **Site_Manager**: Role yang memiliki full access ke semua fitur visit management
- **Sales**: Role yang bisa buat customer, lihat plan visit assigned, buat realisasi visit, attendance
- **GPS_Tracker**: Komponen untuk tracking lokasi menggunakan browser geolocation API
- **Location_Validator**: Komponen untuk validasi jarak maksimal dari lokasi customer

## Requirements

### Requirement 1: Plan Visit Management Page

**User Story:** As a Site Manager, I want to manage plan visits (create/edit/delete), so that I can organize sales visits efficiently.

#### Acceptance Criteria

1. WHEN a Site Manager accesses the plan visit page, THE Plan_Visit_Page SHALL display all plan visits with customer info, assigned sales, and status
2. WHEN a Site Manager clicks create plan visit, THE Plan_Visit_Page SHALL show a form with customer selection, sales assignment, date, time, and location fields
3. WHEN a Site Manager submits a valid plan visit form, THE Plan_Visit_Page SHALL call `/api/plan-visits` POST endpoint and refresh the list
4. WHEN a Site Manager clicks edit on a plan visit, THE Plan_Visit_Page SHALL populate the form with existing data for modification
5. WHEN a Site Manager clicks delete on a plan visit, THE Plan_Visit_Page SHALL show confirmation dialog and call DELETE endpoint
6. WHEN a Sales user accesses the plan visit page, THE Plan_Visit_Page SHALL display only visits assigned to them with read-only access
7. WHEN a Sales user clicks create plan visit, THE Plan_Visit_Page SHALL show form allowing them to create visits for their customers only

### Requirement 2: Sales Plan Visit Creation

**User Story:** As a Sales, I want to create plan visits for my customers, so that I can schedule my own visits.

#### Acceptance Criteria

1. WHEN a Sales user creates a plan visit, THE Plan_Visit_Page SHALL only show customers created by the current sales user
2. WHEN a Sales user submits a plan visit form, THE Plan_Visit_Page SHALL automatically assign the visit to the current sales user
3. THE Plan_Visit_Page SHALL validate that sales can only create visits for their own customers
4. WHEN a plan visit is created by sales, THE Plan_Visit_Page SHALL set status to 'pending' by default

### Requirement 3: Realisasi Visit Page with GPS Tracking

**User Story:** As a Sales, I want to perform visit realization with GPS tracking, so that I can complete assigned visits with location verification.

#### Acceptance Criteria

1. WHEN a Sales user accesses realisasi visit page, THE Realisasi_Visit_Page SHALL display pending plan visits assigned to them
2. WHEN a Sales user clicks "Mulai Visit" on a plan visit, THE GPS_Tracker SHALL request location permission and get current coordinates
3. WHEN GPS location is obtained, THE Location_Validator SHALL verify the sales is within 100 meters of customer location
4. IF the sales is outside the allowed radius, THEN THE Realisasi_Visit_Page SHALL show error message and prevent visit start
5. WHEN location is validated, THE Realisasi_Visit_Page SHALL show visit form with notes, photos, and completion status fields
6. WHEN a Sales user submits realisasi visit form, THE Realisasi_Visit_Page SHALL call `/api/realisasi-visits` POST endpoint with GPS coordinates
7. WHEN a visit is completed, THE Realisasi_Visit_Page SHALL update the plan visit status and refresh the pending list

### Requirement 4: GPS Location Validation

**User Story:** As a Site Manager, I want GPS validation for visit realization, so that I can ensure visits are performed at correct customer locations.

#### Acceptance Criteria

1. THE GPS_Tracker SHALL use browser geolocation API to get current position with high accuracy
2. THE Location_Validator SHALL calculate distance between current position and customer coordinates using haversine formula
3. WHEN distance is greater than 100 meters, THE Location_Validator SHALL return validation error
4. WHEN GPS is unavailable or permission denied, THE Realisasi_Visit_Page SHALL show appropriate error message
5. THE Realisasi_Visit_Page SHALL store actual GPS coordinates in realisasi visit record for audit purposes

### Requirement 5: Attendance Page with GPS Check-in/Check-out

**User Story:** As a Sales, I want to check-in and check-out with GPS tracking, so that my attendance is recorded with location verification.

#### Acceptance Criteria

1. WHEN a Sales user accesses attendance page, THE Attendance_Page SHALL show current attendance status and today's check-in/out history
2. WHEN a Sales user clicks check-in, THE GPS_Tracker SHALL get current location and THE Attendance_Page SHALL call `/api/attendance/check-in` endpoint
3. WHEN a Sales user clicks check-out, THE GPS_Tracker SHALL get current location and THE Attendance_Page SHALL call `/api/attendance/check-out` endpoint
4. THE Attendance_Page SHALL display check-in/out times with location information
5. WHEN attendance action is successful, THE Attendance_Page SHALL show success message and update the display
6. THE Attendance_Page SHALL show attendance history for the current month with date, check-in/out times, and locations

### Requirement 6: Visit Reports Dashboard

**User Story:** As a Site Manager, I want to view visit reports with filters, so that I can monitor sales performance and visit completion rates.

#### Acceptance Criteria

1. WHEN a Site Manager accesses visit reports page, THE Visit_Reports_Page SHALL display dashboard with summary statistics
2. THE Visit_Reports_Page SHALL provide filter options for daily, weekly, and monthly periods with date range selection
3. WHEN filters are applied, THE Visit_Reports_Page SHALL call `/api/reports/visit-report` endpoint with filter parameters
4. THE Visit_Reports_Page SHALL display charts showing visit completion rates, missed visits, and performance trends
5. WHEN a Site Manager selects sales filter, THE Visit_Reports_Page SHALL show performance data for specific sales person
6. THE Visit_Reports_Page SHALL provide export functionality for report data in PDF format
7. WHEN a Sales user accesses visit reports, THE Visit_Reports_Page SHALL show only their own performance data

### Requirement 7: Sales Performance Analytics

**User Story:** As a Site Manager, I want to view sales performance analytics, so that I can evaluate individual sales effectiveness.

#### Acceptance Criteria

1. THE Visit_Reports_Page SHALL display sales performance comparison table with completion rates
2. WHEN Site Manager clicks on sales performance tab, THE Visit_Reports_Page SHALL call `/api/reports/sales-performance` endpoint
3. THE Visit_Reports_Page SHALL show ranking of sales by visit completion percentage
4. THE Visit_Reports_Page SHALL display individual sales metrics including total visits, completed, missed, and performance rate
5. THE Visit_Reports_Page SHALL provide drill-down capability to view detailed visit history for each sales

### Requirement 8: Warnings Management Page

**User Story:** As a Site Manager, I want to view and manage warning notifications, so that I can address issues and monitor system alerts.

#### Acceptance Criteria

1. WHEN a Site Manager accesses warnings page, THE Warnings_Page SHALL display all warning notifications with priority levels
2. THE Warnings_Page SHALL show warning details including title, message, user, timestamp, and read status
3. WHEN a Site Manager clicks on a warning, THE Warnings_Page SHALL mark it as read and call `/api/warnings/{id}/read` endpoint
4. THE Warnings_Page SHALL provide "Mark All as Read" functionality calling `/api/warnings/mark-all-read` endpoint
5. THE Warnings_Page SHALL allow filtering warnings by read/unread status and date range
6. THE Warnings_Page SHALL display warning statistics showing total, unread, and resolved counts
7. WHEN a warning is marked as read, THE Warnings_Page SHALL update the display and notification badge counts

### Requirement 9: Navigation Integration

**User Story:** As a user with visit management access, I want proper navigation to all visit management pages, so that I can easily access different features.

#### Acceptance Criteria

1. THE Visit_Management_System SHALL add navigation links for all visit management pages in the sidebar
2. WHEN a user has visit management permissions, THE Sidebar SHALL display visit management section with appropriate menu items
3. THE Navigation SHALL show different menu items based on user role (Site Manager vs Sales)
4. THE Navigation SHALL highlight active page and maintain consistent styling with existing design
5. THE Navigation SHALL include proper route definitions in React Router for all new pages

### Requirement 10: Responsive Design and User Experience

**User Story:** As a user, I want all visit management pages to be responsive and user-friendly, so that I can use them effectively on different devices.

#### Acceptance Criteria

1. THE Visit_Management_System SHALL implement responsive design for all pages using Tailwind CSS
2. THE Visit_Management_System SHALL maintain consistent styling with existing pages (Site Manager green theme, Sales red theme)
3. THE Visit_Management_System SHALL provide loading states and error handling for all API calls
4. THE Visit_Management_System SHALL use React Hot Toast for user notifications and feedback
5. THE Visit_Management_System SHALL implement proper form validation with user-friendly error messages
6. THE Visit_Management_System SHALL provide confirmation dialogs for destructive actions like delete operations

### Requirement 11: GPS Permission and Error Handling

**User Story:** As a Sales user, I want clear guidance when GPS is required, so that I understand why location access is needed and how to enable it.

#### Acceptance Criteria

1. WHEN GPS permission is required, THE GPS_Tracker SHALL show clear explanation of why location access is needed
2. WHEN GPS permission is denied, THE Visit_Management_System SHALL provide instructions on how to enable location access
3. WHEN GPS is unavailable, THE Visit_Management_System SHALL show appropriate fallback options or error messages
4. THE GPS_Tracker SHALL handle timeout scenarios when location acquisition takes too long
5. THE Visit_Management_System SHALL provide manual location entry as fallback when GPS fails

### Requirement 12: Data Synchronization and Real-time Updates

**User Story:** As a Site Manager, I want real-time updates when sales complete visits, so that I can monitor progress immediately.

#### Acceptance Criteria

1. WHEN a visit is completed, THE Visit_Management_System SHALL refresh dashboard statistics automatically
2. THE Visit_Management_System SHALL update plan visit status in real-time when realisasi is created
3. THE Visit_Management_System SHALL maintain data consistency between plan visits and realisasi visits
4. THE Visit_Management_System SHALL handle concurrent access scenarios when multiple users modify data simultaneously
5. THE Visit_Management_System SHALL provide optimistic updates with proper error handling and rollback capabilities