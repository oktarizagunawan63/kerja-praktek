<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ActivityLog;
use App\Mail\PasswordResetMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PasswordResetController extends Controller
{
    /**
     * Step 1: Send OTP to email
     */
    public function sendResetToken(Request $request)
    {
        try {
            // Validate email
            $request->validate([
                'email' => 'required|email'
            ]);

            // Step 2: Check if email exists in database
            $user = User::where('email', $request->email)->first();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email tidak ditemukan dalam sistem.'
                ], 404);
            }

            if (!$user->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akun tidak aktif. Hubungi administrator.'
                ], 403);
            }

            // Step 3: Generate 6-digit OTP
            $token = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
            
            // Save hashed token to database with 10 minutes expiry
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $request->email],
                [
                    'token' => Hash::make($token), // Hash token for security
                    'expires_at' => Carbon::now()->addMinutes(10),
                    'created_at' => Carbon::now()
                ]
            );

            // Step 4: Send token via email using SMTP (Gmail)
            Mail::to($user->email)->send(new PasswordResetMail($user, $token));
            
            // Log activity
            ActivityLog::create([
                'user_id'    => $user->id,
                'action'     => 'password_reset_request',
                'description'=> 'Kode verifikasi reset password dikirim ke email',
                'ip_address' => $request->ip(),
            ]);

            Log::info("Password reset OTP sent to: {$user->email}");

            return response()->json([
                'success' => true,
                'message' => 'Kode verifikasi telah dikirim ke email Anda. Silakan cek inbox atau spam folder.',
                'email' => $user->email,
                'expires_in' => '10 menit'
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Email tidak valid.',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            Log::error("Password reset send token error: " . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim kode verifikasi. Silakan coba lagi.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Step 5: Verify OTP code
     */
    public function verifyToken(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'token' => 'required|string|size:6'
            ]);

            $resetRecord = DB::table('password_reset_tokens')
                ->where('email', $request->email)
                ->first();

            if (!$resetRecord) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kode tidak valid atau sudah kedaluwarsa.'
                ], 400);
            }

            // Step 6: Check if token is expired (10 minutes)
            if (Carbon::now()->isAfter($resetRecord->expires_at)) {
                DB::table('password_reset_tokens')->where('email', $request->email)->delete();
                return response()->json([
                    'success' => false,
                    'message' => 'Kode sudah kedaluwarsa. Silakan minta kode baru.'
                ], 400);
            }

            // Step 7: Verify token using Hash::check
            if (!Hash::check($request->token, $resetRecord->token)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kode salah atau expired.'
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'Kode valid. Silakan masukkan password baru.'
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak valid.',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            Log::error("Password reset verify token error: " . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem. Silakan coba lagi.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Step 8: Reset password with verified token
     */
    public function resetPassword(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'token' => 'required|string|size:6',
                'password' => 'required|string|min:6|confirmed'
            ]);

            $resetRecord = DB::table('password_reset_tokens')
                ->where('email', $request->email)
                ->first();

            if (!$resetRecord) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kode tidak valid atau sudah kedaluwarsa.'
                ], 400);
            }

            // Check if token is expired
            if (Carbon::now()->isAfter($resetRecord->expires_at)) {
                DB::table('password_reset_tokens')->where('email', $request->email)->delete();
                return response()->json([
                    'success' => false,
                    'message' => 'Kode sudah kedaluwarsa. Silakan minta kode baru.'
                ], 400);
            }

            // Verify token using Hash::check
            if (!Hash::check($request->token, $resetRecord->token)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kode salah atau expired.'
                ], 400);
            }

            // Update password
            $user = User::where('email', $request->email)->first();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak ditemukan.'
                ], 404);
            }

            $user->update([
                'password' => Hash::make($request->password)
            ]);

            // Delete used token
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();

            // Revoke all existing tokens for security
            $user->tokens()->delete();

            // Log activity
            ActivityLog::create([
                'user_id'    => $user->id,
                'action'     => 'password_reset_success',
                'description'=> 'Password berhasil direset',
                'ip_address' => $request->ip(),
            ]);

            Log::info("Password successfully reset for user: {$user->email}");

            return response()->json([
                'success' => true,
                'message' => 'Password berhasil direset. Silakan login dengan password baru.'
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak valid.',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            Log::error("Password reset error: " . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem. Silakan coba lagi.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Clean expired tokens (can be called via cron job)
     */
    public function cleanExpiredTokens()
    {
        try {
            $deleted = DB::table('password_reset_tokens')
                ->where('expires_at', '<', Carbon::now())
                ->delete();

            return response()->json([
                'success' => true,
                'message' => "Cleaned {$deleted} expired tokens"
            ]);
        } catch (\Exception $e) {
            Log::error("Clean expired tokens error: " . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to clean expired tokens',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}