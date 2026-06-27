<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\PlanVisitController;
use App\Http\Controllers\RealisasiVisitController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\WarningController;
use App\Http\Controllers\VisitReportController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\ManpowerController;
use App\Http\Controllers\ProgressReportController;
use App\Http\Controllers\EngineerController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\SalesManagerController;
use App\Http\Controllers\SiteManagerController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\SalesFunnelController;
use App\Http\Controllers\FunnelActivityController;

// Public routes
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'Laravel API is working!',
        'timestamp' => now()->toISOString(),
        'server' => 'Laravel ' . app()->version()
    ]);
});

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/auth/register', [UserController::class, 'register'])->middleware('throttle:3,1');

Route::prefix('password')->middleware('throttle:3,1')->group(function () {
    Route::post('/forgot', [PasswordResetController::class, 'sendResetToken']);
    Route::post('/verify', [PasswordResetController::class, 'verifyToken']);
    Route::post('/reset', [PasswordResetController::class, 'resetPassword']);
});

// Protected routes
Route::middleware(['auth:sanctum', 'throttle:300,1'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/password', [AuthController::class, 'changePassword']);

    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('/sales', [UserController::class, 'getSalesUsers']);
        Route::get('/engineers', [UserController::class, 'getEngineers']);
        Route::get('/{user}', [UserController::class, 'show']);
        Route::post('/', [UserController::class, 'store']);
        Route::put('/{user}', [UserController::class, 'update']);
        Route::delete('/{user}', [UserController::class, 'destroy']);
        Route::post('/{user}/approve', [UserController::class, 'approve']);
        Route::post('/{user}/reject', [UserController::class, 'reject']);
        Route::post('/{user}/assign-projects', [UserController::class, 'assignProjects']);
    });

    Route::prefix('projects')->group(function () {
        Route::get('/', [ProjectController::class, 'index']);
        Route::post('/', [ProjectController::class, 'store']);
        Route::get('/trash', [ProjectController::class, 'trash']);
        Route::get('/kpi-summary', [ProjectController::class, 'kpiSummary']);
        Route::get('/engineers/list', [ProjectController::class, 'getEngineers']);
        Route::post('/assign-engineers', [ProjectController::class, 'assignEngineersToProject']);
        Route::get('/{project}', [ProjectController::class, 'show']);
        Route::put('/{project}', [ProjectController::class, 'update']);
        Route::delete('/{id}', [ProjectController::class, 'destroy']);
        Route::post('/{id}/restore', [ProjectController::class, 'restore']);
        Route::post('/{project}/complete', [ProjectController::class, 'markComplete']);
        Route::post('/{project}/assign-engineer', [ProjectController::class, 'assignEngineer']);
    });

    Route::prefix('customers')->group(function () {
        Route::get('/', [CustomerController::class, 'index']);
        Route::get('/pending', [CustomerController::class, 'pending']);
        Route::post('/', [CustomerController::class, 'store']);
        Route::get('/{id}', [CustomerController::class, 'show']);
        Route::put('/{id}', [CustomerController::class, 'update']);
        Route::delete('/{id}', [CustomerController::class, 'destroy']);
        Route::post('/{id}/approve', [CustomerController::class, 'approve']);
        Route::post('/{id}/reject', [CustomerController::class, 'reject']);
    });

    Route::prefix('plan-visits')->group(function () {
        Route::get('/', [PlanVisitController::class, 'index']);
        Route::get('/approved', [PlanVisitController::class, 'approved']);
        Route::get('/pending', [PlanVisitController::class, 'pendingPlans']);
        Route::get('/completed', [PlanVisitController::class, 'completedVisits']);
        Route::post('/', [PlanVisitController::class, 'store']);
        Route::get('/{id}', [PlanVisitController::class, 'show']);
        Route::put('/{id}', [PlanVisitController::class, 'update']);
        Route::delete('/{id}', [PlanVisitController::class, 'destroy']);
        Route::post('/{id}/approve', [PlanVisitController::class, 'approvePlan']);
        Route::post('/{id}/reject', [PlanVisitController::class, 'rejectPlan']);
        Route::post('/{id}/complete', [PlanVisitController::class, 'complete']);
    });

    Route::prefix('realisasi-visits')->group(function () {
        Route::get('/', [RealisasiVisitController::class, 'index']); // Riwayat Visit - ALL completed
        Route::get('/my-unplanned', [RealisasiVisitController::class, 'getMyUnplannedVisits']); // My Unplanned Visits
        Route::post('/', [RealisasiVisitController::class, 'store']);
        Route::post('/unplanned', [RealisasiVisitController::class, 'storeUnplanned']);
        Route::get('/pending', [RealisasiVisitController::class, 'getPendingVisits']);
        Route::get('/pending-unplanned', [RealisasiVisitController::class, 'pendingUnplanned']);
        Route::post('/{id}/approve-unplanned', [RealisasiVisitController::class, 'approveUnplanned']);
        Route::post('/{id}/reject-unplanned', [RealisasiVisitController::class, 'rejectUnplanned']);
        Route::get('/{id}', [RealisasiVisitController::class, 'show']);
        Route::put('/{id}', [RealisasiVisitController::class, 'update']);
        Route::delete('/{id}', [RealisasiVisitController::class, 'destroy']);
        Route::post('/{planVisitId}/mark-missed', [RealisasiVisitController::class, 'markAsMissed']);
    });

    Route::prefix('attendance')->group(function () {
        Route::get('/', [AttendanceController::class, 'index']);
        Route::post('/', [AttendanceController::class, 'store']);
        Route::post('/check-in', [AttendanceController::class, 'checkIn']);
        Route::post('/check-out', [AttendanceController::class, 'checkOut']);
        Route::get('/today', [AttendanceController::class, 'getTodayAttendance']);
        Route::get('/summary', [AttendanceController::class, 'summary']);
        Route::get('/{id}', [AttendanceController::class, 'show']);
        Route::delete('/{id}', [AttendanceController::class, 'destroy']);
    });

    Route::prefix('warnings')->group(function () {
        Route::get('/', [WarningController::class, 'index']);
        Route::get('/stats', [WarningController::class, 'getWarningStats']);
        Route::put('/mark-all-read', [WarningController::class, 'markAllAsRead']);
        Route::post('/', [WarningController::class, 'store']);
        Route::get('/{id}', [WarningController::class, 'show']);
        Route::put('/{id}/read', [WarningController::class, 'markAsRead']);
        Route::put('/{id}', [WarningController::class, 'update']);
        Route::delete('/{id}', [WarningController::class, 'destroy']);
    });

    Route::prefix('visit-reports')->group(function () {
        Route::get('/', [VisitReportController::class, 'getVisitReport']);
        Route::get('/sales-performance', [VisitReportController::class, 'getSalesPerformance']);
        Route::get('/dashboard-stats', [VisitReportController::class, 'getDashboardStats']);
        Route::get('/customer/{id}/history', [VisitReportController::class, 'getCustomerVisitHistory']);
    });

    Route::prefix('locations')->group(function () {
        Route::get('/', [LocationController::class, 'index']);
        Route::post('/', [LocationController::class, 'store']);
        Route::get('/{id}', [LocationController::class, 'show']);
        Route::put('/{id}', [LocationController::class, 'update']);
        Route::delete('/{id}', [LocationController::class, 'destroy']);
    });

    Route::get('/activity-logs', [ActivityLogController::class, 'index']);
    Route::get('/activity-logs/{id}', [ActivityLogController::class, 'show']);

    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/{notification}/mark-read', [NotificationController::class, 'markRead']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllRead']);
        Route::delete('/{notification}', [NotificationController::class, 'destroy']);
        Route::delete('/', [NotificationController::class, 'clearAll']);
    });

    Route::prefix('documents')->group(function () {
        Route::get('/', [DocumentController::class, 'index']);
        Route::post('/', [DocumentController::class, 'store']);
        Route::get('/{id}', [DocumentController::class, 'show']);
        Route::get('/{id}/download', [DocumentController::class, 'download']);
        Route::delete('/{id}', [DocumentController::class, 'destroy']);
    });

    Route::prefix('materials')->group(function () {
        Route::get('/', [MaterialController::class, 'index']);
        Route::post('/', [MaterialController::class, 'store']);
        Route::get('/{id}', [MaterialController::class, 'show']);
        Route::put('/{id}', [MaterialController::class, 'update']);
        Route::delete('/{id}', [MaterialController::class, 'destroy']);
    });

    Route::prefix('manpower')->group(function () {
        Route::get('/', [ManpowerController::class, 'index']);
        Route::post('/', [ManpowerController::class, 'store']);
        Route::get('/{id}', [ManpowerController::class, 'show']);
        Route::put('/{id}', [ManpowerController::class, 'update']);
        Route::delete('/{id}', [ManpowerController::class, 'destroy']);
    });

    Route::prefix('progress-reports')->group(function () {
        Route::get('/', [ProgressReportController::class, 'index']);
        Route::post('/', [ProgressReportController::class, 'store']);
        Route::get('/{id}', [ProgressReportController::class, 'show']);
        Route::put('/{id}', [ProgressReportController::class, 'update']);
        Route::delete('/{id}', [ProgressReportController::class, 'destroy']);
    });

    Route::get('/dashboard/engineer', [EngineerController::class, 'dashboard']);
    Route::get('/dashboard/admin', [AdminController::class, 'dashboard']);
    Route::get('/dashboard/sales-manager', [SalesManagerController::class, 'dashboard']);
    Route::get('/dashboard/site-manager', [SiteManagerController::class, 'dashboard']);
    Route::get('/dashboard/sales', [SalesController::class, 'dashboard']);

    // Sales Manager specific routes
    Route::prefix('sales-manager')->group(function () {
        Route::get('/customers', [SalesManagerController::class, 'getCustomers']);
        Route::get('/plan-visits', [SalesManagerController::class, 'getPlanVisits']);
        Route::get('/visit-realizations', [SalesManagerController::class, 'getVisitRealizations']);
        Route::get('/pending-unplanned-visits', [SalesManagerController::class, 'getPendingUnplannedVisits']);
        Route::post('/unplanned-visits/{id}/approve', [SalesManagerController::class, 'approveUnplannedVisit']);
        Route::post('/unplanned-visits/{id}/reject', [SalesManagerController::class, 'rejectUnplannedVisit']);
    });

    // Sales specific routes
    Route::prefix('sales')->group(function () {
        Route::get('/my-unplanned-visits', [SalesController::class, 'getMyUnplannedVisits']);
    });

    // Sales Funnel Management
    Route::prefix('funnels')->group(function () {
        Route::get('/', [SalesFunnelController::class, 'index']);
        Route::post('/', [SalesFunnelController::class, 'store']);
        Route::get('/stats/summary', [SalesFunnelController::class, 'stats']);
        Route::get('/visited-customers', [SalesFunnelController::class, 'getVisitedCustomers']);
        Route::get('/{id}', [SalesFunnelController::class, 'show']);
        Route::put('/{id}', [SalesFunnelController::class, 'update']);
        Route::delete('/{id}', [SalesFunnelController::class, 'destroy']);
        Route::post('/{id}/mark-won', [SalesFunnelController::class, 'markAsWon']);
        Route::post('/{id}/mark-lost', [SalesFunnelController::class, 'markAsLost']);
        
        // Activities
        Route::get('/{id}/activities', [FunnelActivityController::class, 'index']);
        Route::post('/{id}/activities', [FunnelActivityController::class, 'store']);
    });

    Route::get('/engineer/projects', [EngineerController::class, 'getMyProjects']);
    Route::get('/engineer/progress-reports', [EngineerController::class, 'getProgressReports']);
    Route::post('/engineer/progress-reports', [EngineerController::class, 'submitProgressReport']);

    Route::get('/search', [SearchController::class, 'search']);
});

Route::options('/{any}', function () {
    return response()->json([], 200);
})->where('any', '.*');
