<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProgressReportController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ManpowerController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\UserController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::post('/auth/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Projects (all roles can read)
    Route::get('/projects/kpi',    [ProjectController::class, 'kpiSummary']);
    Route::get('/projects',        [ProjectController::class, 'index']);
    Route::get('/projects/{project}', [ProjectController::class, 'show']);

    // Projects (PM & Director only)
    Route::middleware('role:project_manager,director')->group(function () {
        Route::post('/projects',              [ProjectController::class, 'store']);
        Route::put('/projects/{project}',     [ProjectController::class, 'update']);
        Route::delete('/projects/{project}',  [ProjectController::class, 'destroy']);
    });

    // Progress Reports
    Route::get('/projects/{project}/progress',  [ProgressReportController::class, 'index']);
    Route::post('/projects/{project}/progress', [ProgressReportController::class, 'store']);

    // Materials
    Route::get('/projects/{project}/materials',          [MaterialController::class, 'index']);
    Route::post('/projects/{project}/materials',         [MaterialController::class, 'store']);
    Route::put('/projects/{project}/materials/{material}', [MaterialController::class, 'update']);

    // Documents
    Route::get('/documents',           [DocumentController::class, 'index']);
    Route::post('/documents',          [DocumentController::class, 'store']);
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy']);

    // Manpower
    Route::get('/manpower',              [ManpowerController::class, 'index']);
    Route::get('/manpower/distribution', [ManpowerController::class, 'distribution']);
    Route::post('/manpower',             [ManpowerController::class, 'store']);
    Route::put('/manpower/{manpower}',   [ManpowerController::class, 'update']);
    Route::delete('/manpower/{manpower}',[ManpowerController::class, 'destroy']);

    // Notifications
    Route::get('/notifications',                        [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count',           [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/mark-all-read',         [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{notification}/read',   [NotificationController::class, 'markRead']);

    // Activity Log (Director & PM only)
    Route::middleware('role:project_manager,director')->group(function () {
        Route::get('/activity-logs', [ActivityLogController::class, 'index']);
    });

    // Users (Director only)
    Route::middleware('role:director')->group(function () {
        Route::get('/users',          [UserController::class, 'index']);
        Route::post('/users',         [UserController::class, 'store']);
        Route::put('/users/{user}',   [UserController::class, 'update']);
    });
});
