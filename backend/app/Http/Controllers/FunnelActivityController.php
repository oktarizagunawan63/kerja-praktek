<?php

namespace App\Http\Controllers;

use App\Models\FunnelActivity;
use App\Models\SalesFunnel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class FunnelActivityController extends Controller
{
    /**
     * Get activities for a funnel
     */
    public function index($funnelId)
    {
        try {
            $user = Auth::user();
            $funnel = SalesFunnel::findOrFail($funnelId);
            
            // Access control
            if ($user->role === 'sales' && $funnel->assigned_to != $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }
            
            $activities = FunnelActivity::where('funnel_id', $funnelId)
                ->with('creator')
                ->orderBy('activity_date', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $activities
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Funnel activity index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load activities: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store new activity
     */
    public function store(Request $request, $funnelId)
    {
        try {
            $user = Auth::user();
            $funnel = SalesFunnel::findOrFail($funnelId);
            
            // Access control
            if ($user->role === 'sales' && $funnel->assigned_to != $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }
            
            $validator = Validator::make($request->all(), [
                'activity_type' => 'required|in:telepon,whatsapp,email,visit,meeting,demo,kirim_penawaran,revisi_penawaran,lainnya',
                'activity_date' => 'required|date',
                'notes' => 'required|string|min:10',
                'new_stage' => 'nullable|in:prospek,qualified,proposal,negosiasi,closing',
                'new_probability' => 'nullable|in:low,middle,high,very_high'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $data = $validator->validated();
            $data['funnel_id'] = $funnelId;
            $data['created_by'] = $user->id;
            
            // Track stage change
            if (isset($data['new_stage']) && $data['new_stage'] !== $funnel->deal_stage) {
                $data['previous_stage'] = $funnel->deal_stage;
                $funnel->deal_stage = $data['new_stage'];
                $funnel->save();
            }
            
            // Track probability change
            if (isset($data['new_probability']) && $data['new_probability'] !== $funnel->win_probability) {
                $data['previous_probability'] = $funnel->win_probability;
                $funnel->win_probability = $data['new_probability'];
                $funnel->win_percentage = SalesFunnel::getWinPercentageByProbability($data['new_probability']);
                $funnel->save();
            }
            
            $activity = FunnelActivity::create($data);
            
            return response()->json([
                'success' => true,
                'message' => 'Activity berhasil ditambahkan',
                'data' => $activity->load('creator')
            ], 201);
            
        } catch (\Exception $e) {
            \Log::error('Funnel activity store error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create activity: ' . $e->getMessage()
            ], 500);
        }
    }
}
