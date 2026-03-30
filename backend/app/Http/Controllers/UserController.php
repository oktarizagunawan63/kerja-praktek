<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(
            User::select('id', 'name', 'email', 'role', 'is_active', 'created_at')
                ->orderBy('name')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'role'     => 'required|in:project_manager,engineer,director',
        ]);

        $data['password']  = Hash::make($data['password']);
        $data['is_active'] = true;

        $user = User::create($data);

        return response()->json($user->only(['id', 'name', 'email', 'role']), 201);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'role'      => 'sometimes|in:project_manager,engineer,director',
            'is_active' => 'sometimes|boolean',
            'password'  => 'sometimes|string|min:8',
        ]);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);
        return response()->json($user->fresh()->only(['id', 'name', 'email', 'role', 'is_active']));
    }
}
