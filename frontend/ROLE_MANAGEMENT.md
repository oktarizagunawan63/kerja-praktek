# Role Management Documentation

## User Roles

### 1. Direktur (`direktur`)
- **Permissions**: Full access to all features
- **Can access**: 
  - All projects (no filtering)
  - User management
  - Activity logs
  - All CRUD operations
- **Menu items**: Dashboard, Projects, Documents, Reports, Notifications, Activity Log, User Management

### 2. Site Manager (`site_manager`)
- **Permissions**: Project management and operations
- **Can access**:
  - Assigned projects + projects they created (PM field matches their name)
  - Create/edit/complete projects
  - Manage materials and documents
  - Export reports
- **Menu items**: Dashboard, Projects, Documents, Reports, Notifications

### 3. Engineer (`engineer`)
- **Permissions**: Limited to assigned projects
- **Can access**:
  - Only projects assigned by director/site manager
  - Update material quantities
  - Upload documents
  - View project details
- **Menu items**: Dashboard, Projects, Documents, Reports, Notifications

## Role Compatibility

### Legacy Roles
- `director` → automatically treated as `direktur`
- `project_manager` → automatically treated as `site_manager`

### Database Migration
Run the migration to fix existing role data:
```bash
php artisan migrate
```

Or use the fix script:
```bash
php backend/fix-roles.php
```

## Implementation

### Frontend
- Use `roleUtils.js` functions for role checking
- `isDirector(user)` - check if user is director
- `isSiteManager(user)` - check if user is site manager  
- `isEngineer(user)` - check if user is engineer
- `normalizeRole(role)` - normalize role names

### Backend
- Enum values in migration: `['direktur', 'site_manager', 'engineer']`
- AuthController returns normalized role names
- Middleware checks use normalized roles

### Permissions
- Defined in `permissions.js`
- Use `can(user, action)` to check permissions
- Use `filterProjectsByRole(projects, user, allUsers)` for project filtering

## Project Assignment

### Director
- Sees all projects automatically
- No assignment needed

### Site Manager
- Sees projects where:
  - They are manually assigned (`assigned_projects` array)
  - OR they are the PM (`pm_name` matches their name)

### Engineer  
- Sees only projects where:
  - They are manually assigned (`assigned_projects` array)

## Adding New Users

```javascript
// Frontend - userStore
addUser({
  name: 'John Doe',
  email: 'john@ptamsar.co.id', 
  password: 'password',
  role: 'site_manager', // or 'engineer'
  assignedProjects: [] // project IDs as strings
})

// Backend - via API
POST /api/users
{
  "name": "John Doe",
  "email": "john@ptamsar.co.id",
  "password": "password", 
  "role": "site_manager"
}
```

## Best Practices

1. Always use utility functions for role checking
2. Normalize roles when receiving from API
3. Use constants from `constants/index.js`
4. Test with different role combinations
5. Handle legacy role names gracefully