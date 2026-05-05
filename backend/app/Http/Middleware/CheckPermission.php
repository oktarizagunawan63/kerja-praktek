<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        
        if (!$this->can($user, $permission)) {
            return response()->json(['message' => 'Forbidden - Insufficient permissions'], 403);
        }
        
        return $next($request);
    }
    
    /**
     * Check if user has permission
     */
    private function can($user, $permission): bool
    {
        $role = $this->normalizeRole($user->role);
        
        // Administrator has all permissions
        if ($role === 'administrator') {
            return true;
        }
        
        $permissions = [
            // Project Management
            'manage_projects' => ['administrator', 'site_manager', 'sales_manager'],
            'view_projects' => ['administrator', 'site_manager', 'engineer', 'sales_manager', 'sales'],
            'create_project' => ['administrator', 'site_manager', 'sales_manager'],
            'edit_project' => ['administrator', 'site_manager', 'sales_manager'],
            'delete_project' => ['administrator', 'site_manager', 'sales_manager'],
            
            // Visit Management
            'access_visit_management' => ['administrator', 'sales_manager', 'sales'],
            'manage_customers' => ['administrator', 'sales_manager', 'sales'],
            'manage_visits' => ['administrator', 'sales_manager', 'sales'],
            'view_all_visits' => ['administrator', 'sales_manager'],
            
            // User Management
            'manage_users' => ['administrator'],
            'view_users' => ['administrator', 'site_manager'], // Site managers need to see engineers for assignment
            'view_activity_log' => ['administrator'],
            'monitor_attendance' => ['administrator'],
            
            // Reports
            'view_reports' => ['administrator', 'site_manager', 'sales_manager'],
            'view_visit_reports' => ['administrator', 'sales_manager', 'sales'],
        ];
        
        return in_array($role, $permissions[$permission] ?? []);
    }
    
    /**
     * Normalize role names
     */
    private function normalizeRole($role): string
    {
        $roleMap = [
            'direktur' => 'administrator',
            'director' => 'administrator',
            'Administrator' => 'administrator',
            'Direktur' => 'administrator',
            'Director' => 'administrator',
            'project_manager' => 'site_manager',
            'Site Manager' => 'site_manager',
            'Sales Manager' => 'sales_manager',
            'Engineer' => 'engineer',
            'Sales' => 'sales'
        ];
        
        return $roleMap[$role] ?? strtolower($role);
    }
}