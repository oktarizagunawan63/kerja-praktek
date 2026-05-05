<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
            'role'     => 'nullable|string', // Optional role selection
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        if (! $user->is_active) {
            if ($user->status === 'pending') {
                return response()->json(['message' => 'Akun Anda masih menunggu persetujuan.'], 403);
            } elseif ($user->status === 'rejected') {
                return response()->json(['message' => 'Akun Anda ditolak. Hubungi administrator.'], 403);
            } else {
                return response()->json(['message' => 'Akun tidak aktif.'], 403);
            }
        }

        // Role validation if role is specified in request
        if ($request->role) {
            $normalizedUserRole = strtolower($user->role);
            $normalizedRequestRole = strtolower($request->role);
            
            if ($normalizedUserRole !== $normalizedRequestRole) {
                return response()->json([
                    'message' => 'Akun Anda tidak memiliki akses sebagai ' . ucfirst($request->role)
                ], 403);
            }
        }

        // Revoke old tokens
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        ActivityLog::create([
            'user_id'    => $user->id,
            'action'     => 'login',
            'description'=> 'User login',
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'token' => $token,
            'user'  => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
