<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->input('q', '');
        
        if (strlen($query) < 2) {
            return response()->json([
                'projects' => [],
                'customers' => [],
                'users' => []
            ]);
        }

        $user = $request->user();
        $results = [];

        // Search projects (with RBAC filtering)
        $projectQuery = Project::where('name', 'like', "%$query%")
            ->orWhere('location', 'like', "%$query%");

        // Apply RBAC filtering for projects
        switch ($user->role) {
            case 'admin':
                // Admin can see all projects
                break;
            case 'sales_manager':
                $projectQuery->where('project_manager_id', $user->id);
                break;
            case 'site_manager':
                $projectQuery->where('project_manager_id', $user->id);
                break;
            case 'engineer':
                $projectQuery->whereJsonContains('assigned_engineers', (string)$user->id);
                break;
            default:
                $projectQuery->whereRaw('1 = 0'); // No access
        }

        $results['projects'] = $projectQuery
            ->limit(5)
            ->get(['id', 'name', 'location', 'status'])
            ->map(function($project) {
                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'subtitle' => $project->location,
                    'status' => $project->status,
                    'type' => 'project',
                    'url' => "/projects/{$project->id}"
                ];
            });

        // Search customers (only for sales roles)
        if (in_array($user->role, ['admin', 'sales_manager', 'sales'])) {
            $results['customers'] = Customer::where('name', 'like', "%$query%")
                ->orWhere('company', 'like', "%$query%")
                ->orWhere('email', 'like', "%$query%")
                ->limit(5)
                ->get(['id', 'name', 'company', 'email'])
                ->map(function($customer) {
                    return [
                        'id' => $customer->id,
                        'name' => $customer->name,
                        'subtitle' => $customer->company ?: $customer->email,
                        'type' => 'customer',
                        'url' => "/customers/{$customer->id}"
                    ];
                });
        } else {
            $results['customers'] = [];
        }

        // Search users (only for admin/administrator)
        if (in_array($user->role, ['admin', 'administrator'])) {
            $results['users'] = User::where('name', 'like', "%$query%")
                ->orWhere('email', 'like', "%$query%")
                ->limit(5)
                ->get(['id', 'name', 'email', 'role'])
                ->map(function($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'subtitle' => $user->email,
                        'role' => $user->role,
                        'type' => 'user',
                        'url' => "/users"
                    ];
                });
        } else {
            $results['users'] = [];
        }

        return response()->json($results);
    }
}