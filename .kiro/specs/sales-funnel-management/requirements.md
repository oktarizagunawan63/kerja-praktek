# Sales Funnel Management System

## Overview
Sistem manajemen sales funnel untuk tracking pipeline penjualan dari prospek hingga closing, dengan fitur follow-up activity tracking, win/loss analysis, dan integrasi dengan visit management yang sudah ada.

## Database Schema

### Table: sales_funnels
```sql
- id (bigint, primary key)
- customer_name (varchar 255, required)
- customer_company (varchar 255, required)
- customer_phone (varchar 50, nullable)
- customer_email (varchar 255, nullable)
- channel (enum: kontraktor, subdist, rsud, rs_swasta, klinik, puskesmas, lainnya)
- channel_other (varchar 255, nullable) // jika channel = lainnya
- city (varchar 255, required)
- province (varchar 255, nullable)
- segment (enum: sot, igvm, nursecall, umum)
- segment_custom (text, nullable) // jika segment = umum
- qty (decimal 10,2, required)
- unit (enum: unit, set, pcs)
- estimated_value (decimal 15,2, required) // dalam rupiah
- deal_stage (enum: prospek, qualified, proposal, negosiasi, closing)
- deadline_date (date, required) // deadline kebutuhan customer
- target_close_date (date, required) // target sales untuk closing
- win_probability (enum: low, middle, high, very_high)
- win_percentage (integer, default based on probability) // 25, 50, 75, 90
- competitor_name (varchar 255, nullable)
- competitor_notes (text, nullable)
- initial_notes (text, required) // catatan awal kebutuhan
- status (enum: open, won, lost, default: open)
- won_value (decimal 15,2, nullable) // nilai deal aktual saat menang
- won_reason_category (enum, nullable) // harga_kompetitif, relasi, spesifikasi, after_sales, pengiriman, lainnya
- won_notes (text, nullable)
- won_date (date, nullable)
- lost_reason_category (enum, nullable) // kalah_harga, kalah_spesifikasi, kalah_kompetitor, budget_dipotong, proyek_ditunda, customer_batal, lainnya
- lost_competitor (varchar 255, nullable)
- lost_notes (text, nullable)
- lost_date (date, nullable)
- assigned_to (bigint, foreign key to users.id, required)
- created_by (bigint, foreign key to users.id, required)
- last_activity_at (timestamp, nullable) // untuk tracking follow up
- timestamps (created_at, updated_at)
```

### Table: funnel_activities
```sql
- id (bigint, primary key)
- funnel_id (bigint, foreign key to sales_funnels.id, cascade delete)
- activity_type (enum: telepon, whatsapp, email, visit, meeting, demo, kirim_penawaran, revisi_penawaran, lainnya)
- activity_date (datetime, required)
- notes (text, required, min 10 chars)
- previous_stage (enum, nullable) // deal stage sebelum aktivitas
- new_stage (enum, nullable) // deal stage setelah aktivitas
- previous_probability (enum, nullable)
- new_probability (enum, nullable)
- created_by (bigint, foreign key to users.id)
- timestamps (created_at, updated_at)
```

## Backend Implementation

### Migration Files Needed
1. `2026_04_27_200000_create_sales_funnels_table.php`
2. `2026_04_27_210000_create_funnel_activities_table.php`

### Models Needed
1. `app/Models/SalesFunnel.php`
   - Relationships: belongsTo User (assigned_to, created_by), hasMany FunnelActivity
   - Scopes: open, won, lost, myFunnels, needsFollowUp
   - Accessors: formatted values, status badges

2. `app/Models/FunnelActivity.php`
   - Relationships: belongsTo SalesFunnel, belongsTo User (created_by)
   - Auto-update funnel.last_activity_at on create

### Controllers Needed
1. `app/Http/Controllers/SalesFunnelController.php`
   - index() - list with filters, search, sort
   - store() - create new funnel
   - show() - detail with activities
   - update() - edit funnel (only if status = open or admin)
   - destroy() - soft delete (admin only)
   - markAsWon() - konfirmasi menang
   - markAsLost() - konfirmasi kalah
   - stats() - summary cards data

2. `app/Http/Controllers/FunnelActivityController.php`
   - store() - add new activity
   - index() - get activities for a funnel

### API Routes Needed
```php
// Sales Funnel Management
Route::middleware(['auth:sanctum'])->group(function () {
    // Funnel CRUD
    Route::get('/funnels', [SalesFunnelController::class, 'index']);
    Route::post('/funnels', [SalesFunnelController::class, 'store']);
    Route::get('/funnels/{id}', [SalesFunnelController::class, 'show']);
    Route::put('/funnels/{id}', [SalesFunnelController::class, 'update']);
    Route::delete('/funnels/{id}', [SalesFunnelController::class, 'destroy']);
    
    // Funnel Actions
    Route::post('/funnels/{id}/mark-won', [SalesFunnelController::class, 'markAsWon']);
    Route::post('/funnels/{id}/mark-lost', [SalesFunnelController::class, 'markAsLost']);
    
    // Stats
    Route::get('/funnels/stats/summary', [SalesFunnelController::class, 'stats']);
    
    // Activities
    Route::post('/funnels/{id}/activities', [FunnelActivityController::class, 'store']);
    Route::get('/funnels/{id}/activities', [FunnelActivityController::class, 'index']);
});
```

## Frontend Implementation

### Pages Needed

#### 1. FunnelsPage.jsx (List View)
**Location:** `frontend/src/pages/FunnelsPage.jsx`

**Features:**
- Summary cards di atas: Total Pipeline, Total Deal Open, Total Menang Bulan Ini, Win Rate
- Filter panel: segment, channel, deal stage, peluang menang, status, sales, bulan
- Search bar: nama customer atau daerah
- Sort dropdown: nilai terbesar, deadline terdekat, last update
- Data table dengan kolom sesuai spec
- Badge warna untuk deal stage, peluang menang, status
- Action buttons: Detail, Edit, Menang, Kalah
- Pagination
- Loading skeleton
- Empty state

#### 2. FunnelFormPage.jsx (Add/Edit)
**Location:** `frontend/src/pages/FunnelFormPage.jsx`

**Features:**
- Multi-section form dengan grouping jelas
- Conditional fields (channel lainnya, segment umum)
- Auto-format rupiah untuk nilai deal
- Auto-calculate win percentage based on probability
- Date pickers untuk deadline & target close
- Validation real-time
- Sales assignment (auto untuk sales, pilihan untuk sales_manager)
- Toast notification on success/error

#### 3. FunnelDetailPage.jsx (Detail View)
**Location:** `frontend/src/pages/FunnelDetailPage.jsx`

**Features:**
- Header dengan info lengkap funnel
- Badge "Pernah Divisit" jika customer ada di realisasi_visits
- Warning badge jika perlu follow up (7 hari tidak ada aktivitas)
- Timeline aktivitas vertikal dengan icon per jenis aktivitas
- Form tambah aktivitas baru (collapsible)
- Action buttons: Edit, Menang, Kalah (conditional based on status & role)

### Components Needed

#### 1. FunnelStatsCards.jsx
**Location:** `frontend/src/components/funnel/FunnelStatsCards.jsx`
- 4 cards: Total Pipeline, Deal Open, Menang Bulan Ini, Win Rate
- Icon & warna berbeda per card
- Format rupiah untuk nilai

#### 2. FunnelFilters.jsx
**Location:** `frontend/src/components/funnel/FunnelFilters.jsx`
- Multi-select filters
- Clear all button
- Apply filters button
- Responsive collapse di mobile

#### 3. FunnelTable.jsx
**Location:** `frontend/src/components/funnel/FunnelTable.jsx`
- Responsive table dengan horizontal scroll
- Badge components untuk status
- Action dropdown per row
- Sort indicators di header

#### 4. FunnelActivityTimeline.jsx
**Location:** `frontend/src/components/funnel/FunnelActivityTimeline.jsx`
- Vertical timeline dengan icon per activity type
- Show stage changes dengan arrow indicator
- Timestamp formatting
- User avatar & name

#### 5. AddActivityForm.jsx
**Location:** `frontend/src/components/funnel/AddActivityForm.jsx`
- Activity type selector dengan icon
- Date time picker
- Notes textarea dengan min length validation
- Optional stage & probability update
- Submit button

#### 6. MarkWonModal.jsx
**Location:** `frontend/src/components/funnel/MarkWonModal.jsx`
- Input nilai deal aktual
- Kategori alasan menang (dropdown)
- Catatan wajib (min 20 chars)
- Date picker tanggal closing
- Konfirmasi button (hijau)

#### 7. MarkLostModal.jsx
**Location:** `frontend/src/components/funnel/MarkLostModal.jsx`
- Kategori alasan kalah (dropdown)
- Conditional field: nama kompetitor jika pilih "kalah_kompetitor"
- Catatan wajib (min 20 chars)
- Date picker tanggal dipastikan kalah
- Konfirmasi button (merah)

### Routing Updates
**File:** `frontend/src/App.jsx`

```javascript
// Sales Funnel Routes
<Route path="/funnels" element={<FunnelsPage />} />
<Route path="/funnels/create" element={<FunnelFormPage />} />
<Route path="/funnels/:id" element={<FunnelDetailPage />} />
<Route path="/funnels/:id/edit" element={<FunnelFormPage />} />
```

### Sidebar Updates
**File:** `frontend/src/components/layout/Sidebar.jsx`

Add new menu item untuk Sales & Sales Manager:
```javascript
{
  name: 'Sales Funnel',
  icon: TrendingUp, // from lucide-react
  path: '/funnels',
  roles: ['sales', 'sales_manager', 'admin']
}
```

### Dashboard Integration

#### SalesDashboard.jsx Updates
Add 2 new cards:
- Funnel Aktif Saya: jumlah deal open
- Total Pipeline Saya: total nilai Rp

#### SalesManagerDashboard.jsx Updates
Add funnel summary untuk semua sales di bawahnya:
- Total Pipeline Team
- Win Rate Team Bulan Ini
- Top Performer (sales dengan nilai menang terbesar)

## Business Rules Implementation

### 1. Access Control
```javascript
// Sales: hanya lihat funnel miliknya
if (user.role === 'sales') {
  query.where('assigned_to', user.id)
}

// Sales Manager: lihat semua funnel sales di bawahnya
if (user.role === 'sales_manager') {
  const salesIds = await getSalesUnderManager(user.id)
  query.whereIn('assigned_to', salesIds)
}

// Admin: lihat semua
// No filter needed
```

### 2. Edit Restrictions
```javascript
// Funnel won/lost tidak bisa diedit kecuali admin
if (funnel.status !== 'open' && user.role !== 'admin') {
  throw new Error('Funnel yang sudah menang/kalah tidak bisa diedit')
}
```

### 3. Auto Activity Logging
```javascript
// Setiap perubahan deal_stage otomatis create activity
if (oldStage !== newStage) {
  await FunnelActivity.create({
    funnel_id: funnel.id,
    activity_type: 'lainnya',
    activity_date: now(),
    notes: `Deal stage berubah dari ${oldStage} ke ${newStage}`,
    previous_stage: oldStage,
    new_stage: newStage,
    created_by: user.id
  })
}
```

### 4. Notifications & Warnings
```javascript
// H-3 dari target close date, belum ada aktivitas
if (daysUntilTarget === 3 && daysSinceLastActivity > 0) {
  sendNotification('Deal mendekati target close date, perlu follow up')
}

// 7 hari tidak ada follow up
if (daysSinceLastActivity >= 7) {
  funnel.needs_followup = true
}
```

## Integration with Existing Features

### 1. Customer Visit Integration
```javascript
// Check if customer pernah divisit
const hasVisit = await RealisasiVisit.where('customer_name', funnel.customer_name)
  .orWhere('customer_company', funnel.customer_company)
  .exists()

// Show badge di detail page
if (hasVisit) {
  <Badge color="blue">Pernah Divisit</Badge>
}
```

### 2. Visit Reports Enhancement
Add columns to visit reports:
- Jumlah deal funnel dibuat bulan ini
- Win rate bulan ini

## UI/UX Guidelines

### Color Scheme
- Primary: Red (#DC2626) - sesuai tema aplikasi
- Deal Stage Badges:
  - Prospek: Gray (#6B7280)
  - Qualified: Blue (#3B82F6)
  - Proposal: Yellow (#EAB308)
  - Negosiasi: Orange (#F97316)
  - Closing: Light Green (#10B981)
- Win Probability:
  - Low: Red (#EF4444)
  - Middle: Yellow (#EAB308)
  - High: Green (#10B981)
  - Very High: Dark Blue (#1E40AF)
- Status:
  - Open: Blue (#3B82F6)
  - Menang: Green (#10B981)
  - Kalah: Red (#EF4444)

### Formatting
- Currency: `Rp 1.500.000` (with thousand separator)
- Date: `Senin, 27 April 2026` (full format)
- Percentage: `75%`

### Responsive Design
- Desktop: Full table view
- Tablet: Horizontal scroll table
- Mobile: Card view instead of table

### Loading States
- Skeleton loaders untuk table rows
- Spinner untuk form submissions
- Progress bar untuk bulk operations

### Empty States
- Ilustrasi friendly
- Call-to-action button
- Helpful message

## Testing Checklist

### Backend
- [ ] Migration runs successfully
- [ ] Model relationships work correctly
- [ ] API endpoints return correct data
- [ ] Access control works per role
- [ ] Validation rules enforced
- [ ] Auto activity logging works
- [ ] Notification triggers work

### Frontend
- [ ] List page loads with correct data
- [ ] Filters work correctly
- [ ] Search works
- [ ] Sort works
- [ ] Form validation works
- [ ] Create funnel success
- [ ] Edit funnel success
- [ ] Mark won/lost works
- [ ] Activity timeline displays correctly
- [ ] Add activity works
- [ ] Dashboard cards show correct data
- [ ] Responsive design works
- [ ] Loading states display
- [ ] Empty states display
- [ ] Error handling works

## Implementation Order

### Phase 1: Backend Foundation
1. Create migrations
2. Create models with relationships
3. Create controllers with basic CRUD
4. Add API routes
5. Test with Postman/Insomnia

### Phase 2: Frontend Core
1. Create FunnelsPage (list view)
2. Create FunnelFormPage (add/edit)
3. Create FunnelDetailPage
4. Add routing
5. Update sidebar

### Phase 3: Components & Features
1. Create all reusable components
2. Implement filters & search
3. Implement mark won/lost modals
4. Implement activity timeline
5. Add activity form

### Phase 4: Integration & Polish
1. Integrate with dashboard
2. Add visit integration check
3. Implement notifications
4. Add loading & empty states
5. Responsive design polish
6. Testing & bug fixes

## Notes
- Gunakan existing components (Button, Input, Modal) dari `frontend/src/components/ui/`
- Gunakan existing utilities (formatRupiah, api request) dari `frontend/src/lib/`
- Follow existing code patterns dari pages yang sudah ada
- Maintain consistency dengan design system yang ada
