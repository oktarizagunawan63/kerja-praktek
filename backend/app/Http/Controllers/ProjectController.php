<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectNotification;
use App\Services\ActivityLogger;
use App\Helpers\NotificationHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        try {
            // Check if projects table exists
            if (!Schema::hasTable('projects')) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'total' => 0,
                    'message' => 'Projects table not found - please run migrations'
                ]);
            }

            $user = $request->user();

            // Query all projects with all fields needed by frontend
            $query = Project::query()->orderByDesc('created_at');

            // Role-based filtering:
            // - Administrator and Sales Manager reports can read all projects.
            // - Site manager sees only projects they manage/create.
            // - Engineer sees only assigned projects.
            if ($user && !in_array($user->role, ['administrator', 'admin', 'sales_manager'], true)) {
                if ($user->role === 'site_manager') {
                    $query->where(function ($q) use ($user) {
                        $q->where('project_manager_id', $user->id);

                        if (Schema::hasColumn('projects', 'site_manager_id')) {
                            $q->orWhere('site_manager_id', $user->id);
                        }

                        if (Schema::hasColumn('projects', 'created_by')) {
                            $q->orWhere('created_by', $user->id);
                        }
                    });
                } elseif ($user->role === 'engineer') {
                    $query->where(function ($q) use ($user) {
                        $q->whereHas('assignments', fn($assignmentQuery) => $assignmentQuery->where('user_id', $user->id))
                            ->orWhereJsonContains('assigned_engineers', (string) $user->id);
                    });
                } else {
                    $query->whereRaw('1 = 0');
                }
            }

            $projects = $query->get()->map(fn($p) => $this->format($p));

            return response()->json([
                'success' => true,
                'data' => $projects,
                'total' => $projects->count()
            ]);
            
        } catch (\Exception $e) {
            Log::error('Projects index error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'data' => [],
                'message' => 'Failed to load projects: ' . $e->getMessage()
            ], 500);
        }
    }

    public function trash(Request $request)
    {
        $projects = Project::onlyTrashed()
            ->with('projectManager:id,name')
            ->orderByDesc('deleted_at')
            ->get();
        return response()->json($projects->map(fn($p) => $this->format($p)));
    }

    public function store(Request $request)
    {
        try {
            $user = $request->user();
            
            // Log incoming data for debugging
            \Log::info('Project store data: ' . json_encode($request->all()));
            
            // RBAC: Only Administrator, Sales Manager and Site Manager can create projects
            if (!in_array($user->role, ['administrator', 'site_manager', 'sales_manager'])) {
                $response = response()->json(['success' => false, 'message' => 'Tidak memiliki izin untuk membuat proyek'], 403);
                $response->header('Access-Control-Allow-Origin', '*');
                $response->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                $response->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
                return $response;
            }

            $data = $request->validate([
                'name'     => 'required|string|max:255',
                'location' => 'required|string|max:255',
                'pm'       => 'sometimes|string|max:255',
                'phone'    => 'nullable|email',
                'deadline' => 'required|date',
                'rab'      => 'required|numeric|min:0',
            ]);

            $days = now()->diffInDays($data['deadline'], false);
            $status = $days < 0 ? 'delayed' : ($days <= 30 ? 'at_risk' : 'on_track');

            // Create project with only existing database columns
            $project = Project::create([
                'name'               => $data['name'],
                'location'           => $data['location'],
                'pm_name'            => $data['pm'] ?? $user->name,
                'pm_email'           => $data['phone'] ?? $user->email,
                'end_date'           => $data['deadline'],
                'start_date'         => now()->toDateString(),
                'rab'                => $data['rab'],
                'rab_realisasi'      => 0,
                'progress'           => 0,
                'status'             => $status,
                'project_manager_id' => $user->id,
                'created_by'         => $user->id,
                'site_manager_id'    => $user->role === 'site_manager' ? $user->id : null,
                'user_id'            => $user->id,
                'assigned_engineers' => [],
            ]);

            // Notify admin only
            $admins = \App\Models\User::whereIn('role', ['administrator', 'admin'])->get();
            foreach ($admins as $admin) {
                \App\Models\ProjectNotification::create([
                    'project_id' => $project->id,
                    'user_id' => $admin->id,
                    'title' => 'Proyek Baru Dibuat',
                    'message' => "Proyek '{$project->name}' telah ditambahkan ke sistem oleh {$user->name}",
                    'type' => 'info',
                    'is_read' => false,
                ]);
            }

            // Log activity
            ActivityLogger::log($user, 'Tambah Proyek', "Membuat proyek: {$project->name}", $project->id);

            $response = response()->json([
                'success' => true,
                'data' => $this->format($project->load('projectManager:id,name')),
                'message' => 'Proyek berhasil dibuat'
            ], 201);
            
            // Add CORS headers to response
            $response->header('Access-Control-Allow-Origin', '*');
            $response->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            
            return $response;
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Project store validation error: ' . json_encode($e->errors()));
            $response = response()->json([
                'success' => false,
                'message' => 'Data tidak valid: ' . implode(', ', Arr::flatten($e->errors())),
                'errors' => $e->errors()
            ], 422);
            
            $response->header('Access-Control-Allow-Origin', '*');
            $response->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            
            return $response;
            
        } catch (\Exception $e) {
            \Log::error('Project store error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            $response = response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menyimpan proyek: ' . $e->getMessage()
            ], 500);
            
            $response->header('Access-Control-Allow-Origin', '*');
            $response->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            
            return $response;
        }
    }

    public function show(Project $project)
    {
        $user = request()->user();
        
        // RBAC: Check if user can access this project
        if (!$this->canAccessProject($user, $project)) {
            $response = response()->json(['message' => 'Tidak memiliki akses ke proyek ini'], 403);
            $response->header('Access-Control-Allow-Origin', '*');
            $response->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            return $response;
        }
        
        $response = response()->json($this->format($project->load(['projectManager:id,name', 'materials', 'documents.uploader:id,name', 'assignments'])));
        $response->header('Access-Control-Allow-Origin', '*');
        $response->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        
        return $response;
    }

    public function update(Request $request, Project $project)
    {
        $user = $request->user();
        $allowedFields = ['name', 'location', 'pm', 'phone', 'deadline', 'rab', 'realisasi', 'progress'];
        $requestedFields = collect($request->only($allowedFields))
            ->filter(fn($value) => $value !== null)
            ->keys()
            ->values();
        $isRabOnlyUpdate = $requestedFields->count() === 1 && $requestedFields->first() === 'realisasi';
        
        // RBAC: Check if user can update this project
        if (!$this->canUpdateProject($user, $project) && !($isRabOnlyUpdate && $this->canUpdateRabRealization($user, $project))) {
            $response = response()->json(['message' => 'Tidak memiliki izin untuk mengupdate proyek ini'], 403);
            $response->header('Access-Control-Allow-Origin', '*');
            $response->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            return $response;
        }

        $data = $request->validate([
            'name'       => 'sometimes|string|max:255',
            'location'   => 'sometimes|string|max:255',
            'pm'         => 'sometimes|string|max:255',
            'phone'      => 'nullable|email',
            'deadline'   => 'sometimes|date',
            'rab'        => 'sometimes|numeric|min:0',
            'realisasi'  => 'sometimes|numeric|min:0',
            'progress'   => 'sometimes|integer|min:0|max:100',
        ]);

        $mapped = [];
        if (isset($data['name']))      $mapped['name']             = $data['name'];
        if (isset($data['location']))  $mapped['location']         = $data['location'];
        if (isset($data['pm']))        $mapped['pm_name']          = $data['pm'];
        if (isset($data['phone']))     $mapped['pm_email']         = $data['phone'];
        if (isset($data['deadline']))  $mapped['end_date']         = $data['deadline'];
        if (isset($data['rab']))       $mapped['rab']             = $data['rab'];
        if (isset($data['realisasi'])) $mapped['rab_realisasi']   = $data['realisasi'];
        if (isset($data['progress']))  $mapped['progress']         = $data['progress'];

        // Auto status dari deadline
        $deadline = $mapped['end_date'] ?? $project->end_date;
        $days = now()->diffInDays($deadline, false);
        if ($project->status !== 'completed') {
            $mapped['status'] = $days < 0 ? 'delayed' : ($days <= 30 ? 'at_risk' : 'on_track');
        }

        $project->update($mapped);

        // Check over budget and send notification
        if ($project->rab_realisasi > $project->rab) {
            NotificationHelper::projectOverBudget($project);
        }

        // Check deadline warning
        if ($days <= 30 && $days > 0 && $project->progress < 80) {
            NotificationHelper::deadlineApproaching($project);
        }

        ActivityLogger::log($request->user(), 'Update Proyek', "Update proyek: {$project->name}", $project->id);

        $response = response()->json($this->format($project->fresh()));
        $response->header('Access-Control-Allow-Origin', '*');
        $response->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        
        return $response;
    }

    public function markComplete(Request $request, Project $project)
    {
        $note = $request->input('note', '');
        $project->update(['status' => 'completed', 'progress' => 100, 'completed_at' => now()]);

        // Send notifications
        NotificationHelper::projectCompleted($project, $request->user());

        ActivityLogger::log($request->user(), 'Proyek Selesai', "Proyek selesai: {$project->name}", $project->id);

        return response()->json($this->format($project->fresh()));
    }

    public function destroy(Request $request, $id)
    {
        // Start database transaction
        DB::beginTransaction();
        
        try {
            // 1. LOG REQUEST START
            Log::info('DELETE project request started', [
                'project_id' => $id,
                'user_id' => auth()->id(),
                'ip' => $request->ip(),
                'user_agent' => substr($request->userAgent() ?? '', 0, 100),
                'has_password' => !empty($request->password),
                'timestamp' => now()->toISOString()
            ]);

            // 2. VALIDATE REQUEST
            $request->validate([
                'password' => 'required|string|min:1'
            ]);

            // 3. AUTHENTICATION CHECK
            $user = auth()->user();
            if (!$user) {
                Log::warning('DELETE project: User not authenticated', [
                    'project_id' => $id,
                    'ip' => $request->ip()
                ]);
                
                return $this->errorResponse('User not authenticated', 401);
            }

            Log::info('DELETE project: User authenticated', [
                'project_id' => $id,
                'user_id' => $user->id,
                'user_role' => $user->role,
                'user_email' => $user->email
            ]);

            // 4. PASSWORD VALIDATION
            if (!Hash::check($request->password, $user->password)) {
                Log::warning('DELETE project: Invalid password', [
                    'project_id' => $id,
                    'user_id' => $user->id,
                    'ip' => $request->ip(),
                    'attempt_time' => now()->toISOString()
                ]);
                
                return $this->errorResponse('Password salah', 403);
            }

            // 5. PROJECT EXISTENCE CHECK
            try {
                $project = Project::findOrFail($id);
                
                Log::info('DELETE project: Project found', [
                    'project_id' => $id,
                    'project_name' => $project->name,
                    'project_manager_id' => $project->project_manager_id ?? 'null',
                    'project_status' => $project->status ?? 'unknown'
                ]);
                
            } catch (ModelNotFoundException $e) {
                Log::error('DELETE project: Project not found', [
                    'project_id' => $id,
                    'user_id' => $user->id,
                    'error' => $e->getMessage()
                ]);
                
                return $this->errorResponse('Proyek tidak ditemukan', 404);
            }

            // 6. AUTHORIZATION CHECK
            $authCheck = $this->checkDeleteAuthorization($user, $project);
            if (!$authCheck['allowed']) {
                Log::warning('DELETE project: Access denied', [
                    'project_id' => $id,
                    'user_id' => $user->id,
                    'user_role' => $user->role,
                    'reason' => $authCheck['reason']
                ]);
                
                return $this->errorResponse($authCheck['message'], 403);
            }

            // 7. CLEAN RELATED RECORDS
            $deletedRelations = $this->deleteRelatedProjectRecords($project);

            // 8. PERFORM DELETE
            $projectName = $project->name;
            $projectData = [
                'id' => $project->id,
                'name' => $project->name,
                'location' => $project->location ?? 'Unknown',
                'deleted_relations' => $deletedRelations,
            ];

            // Soft delete if available
            $project->delete();

            // 9. LOG SUCCESS
            Log::info('DELETE project: Success', [
                'project_id' => $id,
                'project_name' => $projectName,
                'user_id' => $user->id,
                'deleted_relations' => $deletedRelations,
                'deleted_at' => now()->toISOString()
            ]);

            // Commit transaction
            DB::commit();

            return $this->successResponse([
                'deleted_project' => $projectData
            ], 'Proyek berhasil dihapus');

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            
            Log::error('DELETE project: Validation error', [
                'project_id' => $id,
                'errors' => $e->errors(),
                'user_id' => auth()->id()
            ]);
            
            return $this->errorResponse(
                'Password wajib diisi',
                422,
                ['errors' => $e->errors()]
            );

        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            
            Log::error('DELETE project: Database error', [
                'project_id' => $id,
                'error_message' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'sql' => $e->getSql() ?? 'N/A',
                'bindings' => $e->getBindings() ?? [],
                'user_id' => auth()->id(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            // Handle specific database errors
            if (str_contains($e->getMessage(), 'foreign key constraint') || 
                str_contains($e->getMessage(), 'FOREIGN KEY constraint failed')) {
                return $this->errorResponse(
                    'Tidak dapat menghapus proyek karena masih memiliki data terkait (materials, documents, progress reports). Hapus data terkait terlebih dahulu.',
                    409
                );
            }

            if (str_contains($e->getMessage(), 'Connection refused') || 
                str_contains($e->getMessage(), 'server has gone away')) {
                return $this->errorResponse('Database connection error. Please try again.', 503);
            }

            return $this->errorResponse('Database error occurred', 500);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('DELETE project: Unexpected error', [
                'project_id' => $id,
                'error_message' => $e->getMessage(),
                'error_class' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'user_id' => auth()->id(),
                'request_data' => $request->except(['password']) // Don't log password
            ]);

            return $this->errorResponse(
                'Terjadi kesalahan sistem. Silakan coba lagi atau hubungi administrator.',
                500
            );
        }
    }

    public function assignEngineer(Request $request, Project $project)
    {
        $user = $request->user();
        
        // RBAC: Only Site Manager can assign engineers to their projects
        if ($user->role !== 'site_manager' || $project->project_manager_id !== $user->id) {
            return response()->json(['message' => 'Hanya Site Manager yang dapat meng-assign engineer ke proyeknya'], 403);
        }

        $data = $request->validate([
            'engineer_id' => 'required|exists:users,id'
        ]);

        // Verify the engineer is in engineering division
        $engineer = \App\Models\User::find($data['engineer_id']);
        if ($engineer->role !== 'engineer') {
            return response()->json(['message' => 'User yang dipilih bukan engineer'], 422);
        }

        $assignedEngineers = $project->assigned_engineers ?? [];
        
        // Toggle assignment
        if (in_array((string)$data['engineer_id'], $assignedEngineers)) {
            $assignedEngineers = array_values(array_filter($assignedEngineers, fn($id) => $id !== (string)$data['engineer_id']));
            $action = 'unassigned';
        } else {
            $assignedEngineers[] = (string)$data['engineer_id'];
            $action = 'assigned';
        }

        $project->update(['assigned_engineers' => $assignedEngineers]);

        // Send notification to engineer when assigned
        if ($action === 'assigned') {
            \App\Models\ProjectNotification::create([
                'project_id' => $project->id,
                'user_id' => $data['engineer_id'],
                'title' => 'Ditugaskan ke Proyek',
                'message' => "Anda telah ditugaskan ke proyek '{$project->name}' oleh {$user->name}",
                'type' => 'info',
                'is_read' => false,
            ]);
        }

        ActivityLogger::log($user, 'Assign Engineer', "Engineer {$engineer->name} {$action} ke proyek {$project->name}", $project->id);

        return response()->json([
            'message' => "Engineer {$engineer->name} berhasil {$action}",
            'project' => $this->format($project->fresh())
        ]);
    }

    public function options(Request $request)
    {
        return response()->json([], 200)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
            ->header('Access-Control-Max-Age', '86400');
    }

    public function assignEngineersToProject(Request $request)
    {
        try {
            $user = $request->user();
            
            // Validate input with more flexible project_id validation
            $data = $request->validate([
                'project_id' => 'required', // Accept both integer and string
                'engineer_ids' => 'required|array|min:1',
                'engineer_ids.*' => 'required'
            ]);

            // Convert to integers for consistency
            $projectId = (int) $data['project_id'];
            $engineerIds = array_map('intval', $data['engineer_ids']);

            \Log::info('Engineer assignment request', [
                'project_id' => $projectId,
                'engineer_ids' => $engineerIds,
                'user' => $user->email
            ]);

            // RBAC: Allow administrator and site_manager to assign engineers
            if (!in_array($user->role, ['administrator', 'site_manager'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya Administrator atau Site Manager yang dapat meng-assign engineer'
                ], 403);
            }

            // For localStorage projects, we'll just validate engineers exist and return success
            // The frontend will handle the actual assignment in localStorage
            $assignedCount = 0;
            $engineerNames = [];
            $validEngineers = [];

            foreach ($engineerIds as $engineerId) {
                $engineer = \App\Models\User::find($engineerId);
                
                if (!$engineer) {
                    \Log::warning("Engineer not found: $engineerId");
                    continue;
                }
                
                if ($engineer->role !== 'engineer') {
                    \Log::warning("User is not an engineer: {$engineer->email} (role: {$engineer->role})");
                    continue;
                }

                $validEngineers[] = $engineer;
                $assignedCount++;
                $engineerNames[] = $engineer->name;
            }

            if ($assignedCount === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada engineer valid yang ditemukan'
                ], 422);
            }

            // Try to find project in database for logging
            $project = \App\Models\Project::find($projectId);
            $projectName = $project ? $project->name : "Project #$projectId";

            // If project exists in database, sync assignment records
            if ($project) {
                \App\Models\ProjectAssignment::where('project_id', $project->id)
                    ->whereNotIn('user_id', array_map(fn($e) => $e->id, $validEngineers))
                    ->delete();

                foreach ($validEngineers as $engineer) {
                    \App\Models\ProjectAssignment::updateOrCreate(
                        [
                            'project_id' => $project->id,
                            'user_id' => $engineer->id
                        ],
                        [
                            'assigned_by' => $user->id,
                            'assigned_at' => now()
                        ]
                    );
                }

                $project->update([
                    'assigned_engineers' => array_map(fn($e) => (string) $e->id, $validEngineers),
                ]);

                \Log::info("Created database assignments for project: {$project->name}");
            } else {
                \Log::info("Project not in database, frontend will handle localStorage assignment");
            }

            return response()->json([
                'success' => true,
                'message' => "{$assignedCount} engineer berhasil di-assign ke proyek {$projectName}",
                'assigned_count' => $assignedCount,
                'data' => [
                    'project_id' => $projectId,
                    'project_name' => $projectName,
                    'assigned_engineers' => $engineerNames,
                    'valid_engineer_ids' => array_map(fn($e) => $e->id, $validEngineers)
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error in assignEngineersToProject', [
                'errors' => $e->errors(),
                'input' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Data tidak valid: ' . implode(', ', Arr::flatten($e->errors())),
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            \Log::error('Error in assignEngineersToProject', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'input' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getEngineers()
    {
        try {
            // Get ALL users and log them for debugging
            $allUsers = \App\Models\User::all(['id', 'name', 'email', 'role', 'is_active']);
            \Log::info('ALL USERS: ' . $allUsers->toJson());

            // Get engineers with broad search - check multiple possible role values
            $engineers = \App\Models\User::where(function($query) {
                    $query->where('role', 'engineer')
                          ->orWhere('role', 'Engineer')
                          ->orWhere('role', 'ENGINEER')
                          ->orWhere('role', 'engineering')
                          ->orWhere('role', 'Engineering');
                })
                ->select('id', 'name', 'email', 'role', 'is_active')
                ->get();

            \Log::info('ENGINEERS FOUND: ' . $engineers->count());
            \Log::info('ENGINEER DATA: ' . $engineers->toJson());

            return response()->json([
                'success' => true,
                'data' => $engineers,
                'count' => $engineers->count()
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in ProjectController getEngineers: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch engineers: ' . $e->getMessage(),
                'data' => [],
                'count' => 0
            ], 500);
        }
    }

    public function restore(Request $request, $id)
    {
        $project = Project::onlyTrashed()->findOrFail($id);
        $project->restore();
        ActivityLogger::log($request->user(), 'Pulihkan Proyek', "Pulihkan proyek: {$project->name}", $project->id);
        return response()->json($this->format($project));
    }

    public function kpiSummary(Request $request)
    {
        $user = $request->user();
        $query = Project::query();
        
        // Apply RBAC filtering
        switch ($user->role) {
            case 'administrator':
                // Admin can see all projects
                break;
                
            case 'sales_manager':
                $query->where('project_manager_id', $user->id);
                break;
                
            case 'sales':
                $salesManagerIds = \App\Models\User::where('role', 'sales_manager')
                    ->where('division', 'sales')
                    ->pluck('id');
                $query->whereIn('project_manager_id', $salesManagerIds);
                break;
                
            case 'site_manager':
                $query->where('project_manager_id', $user->id);
                break;
                
            case 'engineer':
                $query->whereJsonContains('assigned_engineers', (string)$user->id);
                break;
                
            default:
                $query->whereRaw('1 = 0');
        }

        return response()->json([
            'total'      => $query->clone()->count(),
            'active'     => $query->clone()->whereNotIn('status', ['completed'])->count(),
            'completed'  => $query->clone()->where('status', 'completed')->count(),
            'total_rab'  => $query->clone()->sum('rab'),
            'total_real' => $query->clone()->sum('rab_realisasi'),
            'avg_progress' => round($query->clone()->whereNotIn('status', ['completed'])->avg('progress') ?? 0, 1),
            'delayed'    => $query->clone()->where('status', 'delayed')->count(),
        ]);
    }

    // Map DB fields -> frontend fields
    private function format(Project $p): array
    {
        $assignedEngineers = $p->assigned_engineers;
        if (is_string($assignedEngineers)) {
            $decodedAssignedEngineers = json_decode($assignedEngineers, true);
            $assignedEngineers = is_array($decodedAssignedEngineers) ? $decodedAssignedEngineers : [];
        } elseif (!is_array($assignedEngineers)) {
            $assignedEngineers = [];
        }

        return [
            'id'          => $p->id,
            'name'        => $p->name ?? '',
            'description' => $p->description ?? '',
            'location'    => $p->location ?? '',
            'pm'          => $p->pm_name ?? $p->name ?? 'Unknown',
            'phone'       => $p->pm_email ?? '',
            'deadline'    => $p->end_date ?? $p->deadline ?? null,
            'end_date'    => $p->end_date ?? $p->deadline ?? null,
            'rab'         => (float)($p->rab ?? $p->budget ?? 0),
            'realisasi'   => (float)($p->rab_realisasi ?? $p->budget_realisasi ?? 0),
            'progress'    => $p->progress ?? 0,
            'status'      => $p->status ?? 'on_track',
            'projectManagerId' => $p->project_manager_id ?? null,
            'siteManagerId' => $p->site_manager_id ?? null,
            'createdBy' => $p->created_by ?? null,
            'completedAt' => $p->completed_at ?? $p->completedAt ?? null,
            'deletedAt'   => $p->deleted_at ?? null,
            'assignedEngineers' => array_values(array_map('strval', $assignedEngineers)),
            'materials'   => $p->relationLoaded('materials')
                ? $p->materials->map(fn($m) => [
                    'id' => $m->id,
                    'projectId' => $m->project_id,
                    'name' => $m->name,
                    'unit' => $m->unit,
                    'qty_plan' => (float) $m->qty_plan,
                    'qty_terpasang' => (float) $m->qty_terpasang,
                ])->values()
                : [],
            'documents'   => $p->relationLoaded('documents')
                ? $p->documents->map(fn($d) => [
                    'id' => $d->id,
                    'name' => $d->name,
                    'type' => $d->type,
                    'uploader' => $d->uploader?->name ?? '-',
                    'date' => $d->created_at?->format('d/m/Y'),
                    'previewUrl' => $d->file_url,
                    'fileType' => str_starts_with($d->mime_type ?? '', 'image/') ? 'image' : ($d->mime_type === 'application/pdf' ? 'pdf' : 'other'),
                    'projectId' => $d->project_id,
                ])->values()
                : [],
            'assignments' => $p->relationLoaded('assignments')
                ? $p->assignments->map(fn($assignment) => [
                    'user_id' => $assignment->user_id,
                    'assigned_by' => $assignment->assigned_by,
                    'assigned_at' => $assignment->assigned_at,
                ])->values()
                : [],
            'createdAt'   => $p->created_at ?? null,
        ];
    }

    /**
     * Check if user can delete the project
     */
    private function checkDeleteAuthorization($user, $project)
    {
        // Administrator can delete any project
        if (in_array($user->role, ['administrator', 'admin'])) {
            return [
                'allowed' => true,
                'reason' => 'administrator_access'
            ];
        }

        // Project manager can delete their own projects
        if (isset($project->project_manager_id) && $project->project_manager_id == $user->id) {
            return [
                'allowed' => true,
                'reason' => 'project_manager'
            ];
        }

        // Site manager can delete projects they manage
        if ($user->role === 'site_manager' && 
            isset($project->project_manager_id) && 
            $project->project_manager_id == $user->id) {
            return [
                'allowed' => true,
                'reason' => 'site_manager'
            ];
        }

        return [
            'allowed' => false,
            'reason' => 'insufficient_permissions',
            'message' => 'Anda tidak memiliki izin untuk menghapus proyek ini'
        ];
    }

    /**
     * Delete records that still point to a project before soft deleting it.
     */
    private function deleteRelatedProjectRecords($project): array
    {
        $projectId = $project->id;
        $deleted = [];

        $tablesToDelete = [
            'materials',
            'documents',
            'progress_reports',
            'engineer_progress_reports',
            'project_assignments',
            'manpower',
            'project_notifications',
        ];

        foreach ($tablesToDelete as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'project_id')) {
                $deleted[$table] = DB::table($table)->where('project_id', $projectId)->delete();
            }
        }

        if (Schema::hasTable('activity_logs') && Schema::hasColumn('activity_logs', 'project_id')) {
            $deleted['activity_logs_detached'] = DB::table('activity_logs')
                ->where('project_id', $projectId)
                ->update(['project_id' => null]);
        }

        return array_filter($deleted, fn($count) => $count > 0);
    }

    /**
     * Check foreign key constraints before deletion
     */
    private function checkForeignKeyConstraints($project)
    {
        $constraints = [];

        try {
            // Check materials
            if (\Schema::hasTable('materials')) {
                $count = DB::table('materials')->where('project_id', $project->id)->count();
                if ($count > 0) {
                    $constraints[] = "materials ({$count} records)";
                }
            }

            // Check documents
            if (\Schema::hasTable('documents')) {
                $count = DB::table('documents')->where('project_id', $project->id)->count();
                if ($count > 0) {
                    $constraints[] = "documents ({$count} records)";
                }
            }

            // Check progress reports
            if (\Schema::hasTable('progress_reports')) {
                $count = DB::table('progress_reports')->where('project_id', $project->id)->count();
                if ($count > 0) {
                    $constraints[] = "progress reports ({$count} records)";
                }
            }

            // Check project assignments
            if (\Schema::hasTable('project_assignments')) {
                $count = DB::table('project_assignments')->where('project_id', $project->id)->count();
                if ($count > 0) {
                    $constraints[] = "project assignments ({$count} records)";
                }
            }

            if (!empty($constraints)) {
                return [
                    'can_delete' => false,
                    'constraints' => $constraints,
                    'message' => 'Tidak dapat menghapus proyek karena masih memiliki: ' . implode(', ', $constraints)
                ];
            }

            return ['can_delete' => true];

        } catch (\Exception $e) {
            Log::error('Error checking foreign key constraints', [
                'project_id' => $project->id,
                'error' => $e->getMessage()
            ]);

            // If we can't check, allow deletion but log the issue
            return ['can_delete' => true];
        }
    }

    /**
     * Success response with CORS headers
     */
    private function successResponse($data = [], $message = 'Success')
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => now()->toISOString()
        ])->header('Access-Control-Allow-Origin', '*')
          ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
          ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    }

    /**
     * Error response with CORS headers
     */
    private function errorResponse($message, $status = 500, $additionalData = [])
    {
        $responseData = [
            'success' => false,
            'message' => $message,
            'data' => [],
            'timestamp' => now()->toISOString(),
            'status_code' => $status
        ];

        if (!empty($additionalData)) {
            $responseData = array_merge($responseData, $additionalData);
        }

        return response()->json($responseData, $status)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    }

    /**
     * Check if user can access project
     */
    private function canAccessProject($user, $project)
    {
        // Admin can access all
        if (in_array($user->role, ['administrator', 'admin', 'direktur'])) {
            return true;
        }

        // Project manager can access their projects
        if (isset($project->project_manager_id) && $project->project_manager_id == $user->id) {
            return true;
        }

        if ($user->role === 'site_manager') {
            if (isset($project->site_manager_id) && $project->site_manager_id == $user->id) {
                return true;
            }

            if (isset($project->created_by) && $project->created_by == $user->id) {
                return true;
            }
        }

        // Engineers can access assigned projects
        if ($user->role === 'engineer') {
            $assignedEngineers = $project->assigned_engineers ?? [];
            if (is_string($assignedEngineers)) {
                $decoded = json_decode($assignedEngineers, true);
                $assignedEngineers = is_array($decoded) ? $decoded : [];
            }

            if (in_array((string)$user->id, array_map('strval', (array) $assignedEngineers), true)) {
                return true;
            }

            if ($project->assignments()->where('user_id', $user->id)->exists()) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user can update project
     */
    private function canUpdateProject($user, $project)
    {
        // Admin can update all
        if (in_array($user->role, ['administrator', 'admin'])) {
            return true;
        }

        // Project manager can update their projects
        if (in_array($user->role, ['site_manager', 'sales_manager'])) {
            if (isset($project->project_manager_id) && $project->project_manager_id == $user->id) {
                return true;
            }
        }

        return false;
    }

    private function canUpdateRabRealization($user, $project)
    {
        if (in_array($user->role, ['administrator', 'admin'])) {
            return true;
        }

        if (isset($project->project_manager_id) && $project->project_manager_id == $user->id) {
            return true;
        }

        if ($user->role === 'site_manager') {
            if (isset($project->site_manager_id) && $project->site_manager_id == $user->id) {
                return true;
            }

            if (isset($project->created_by) && $project->created_by == $user->id) {
                return true;
            }
        }

        if ($user->role === 'engineer') {
            $assignedEngineers = $project->assigned_engineers ?? [];
            if (is_string($assignedEngineers)) {
                $decoded = json_decode($assignedEngineers, true);
                $assignedEngineers = is_array($decoded) ? $decoded : [];
            }

            return in_array((string) $user->id, array_map('strval', (array) $assignedEngineers), true)
                || $project->assignments()->where('user_id', $user->id)->exists();
        }

        return false;
    }
}
