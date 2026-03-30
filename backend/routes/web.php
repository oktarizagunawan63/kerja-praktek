<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['app' => 'PT Amsar Dashboard API', 'version' => '1.0']);
});
