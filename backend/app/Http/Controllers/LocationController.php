<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class LocationController extends Controller
{
    /**
     * Get all available locations
     */
    public function index(Request $request)
    {
        // Data lokasi Indonesia (bisa diperluas sesuai kebutuhan)
        $locations = [
            // DKI Jakarta
            ['id' => 1, 'name' => 'Jakarta Pusat', 'province' => 'DKI Jakarta', 'type' => 'city'],
            ['id' => 2, 'name' => 'Jakarta Utara', 'province' => 'DKI Jakarta', 'type' => 'city'],
            ['id' => 3, 'name' => 'Jakarta Selatan', 'province' => 'DKI Jakarta', 'type' => 'city'],
            ['id' => 4, 'name' => 'Jakarta Timur', 'province' => 'DKI Jakarta', 'type' => 'city'],
            ['id' => 5, 'name' => 'Jakarta Barat', 'province' => 'DKI Jakarta', 'type' => 'city'],
            
            // Jawa Barat
            ['id' => 6, 'name' => 'Bandung', 'province' => 'Jawa Barat', 'type' => 'city'],
            ['id' => 7, 'name' => 'Bekasi', 'province' => 'Jawa Barat', 'type' => 'city'],
            ['id' => 8, 'name' => 'Bogor', 'province' => 'Jawa Barat', 'type' => 'city'],
            ['id' => 9, 'name' => 'Depok', 'province' => 'Jawa Barat', 'type' => 'city'],
            ['id' => 10, 'name' => 'Cimahi', 'province' => 'Jawa Barat', 'type' => 'city'],
            
            // Jawa Tengah
            ['id' => 11, 'name' => 'Semarang', 'province' => 'Jawa Tengah', 'type' => 'city'],
            ['id' => 12, 'name' => 'Solo', 'province' => 'Jawa Tengah', 'type' => 'city'],
            ['id' => 13, 'name' => 'Yogyakarta', 'province' => 'DI Yogyakarta', 'type' => 'city'],
            
            // Jawa Timur
            ['id' => 14, 'name' => 'Surabaya', 'province' => 'Jawa Timur', 'type' => 'city'],
            ['id' => 15, 'name' => 'Malang', 'province' => 'Jawa Timur', 'type' => 'city'],
            ['id' => 16, 'name' => 'Sidoarjo', 'province' => 'Jawa Timur', 'type' => 'city'],
            
            // Banten
            ['id' => 17, 'name' => 'Tangerang', 'province' => 'Banten', 'type' => 'city'],
            ['id' => 18, 'name' => 'Tangerang Selatan', 'province' => 'Banten', 'type' => 'city'],
            ['id' => 19, 'name' => 'Serang', 'province' => 'Banten', 'type' => 'city'],
            
            // Sumatra
            ['id' => 20, 'name' => 'Medan', 'province' => 'Sumatra Utara', 'type' => 'city'],
            ['id' => 21, 'name' => 'Palembang', 'province' => 'Sumatra Selatan', 'type' => 'city'],
            ['id' => 22, 'name' => 'Pekanbaru', 'province' => 'Riau', 'type' => 'city'],
            ['id' => 23, 'name' => 'Padang', 'province' => 'Sumatra Barat', 'type' => 'city'],
            
            // Kalimantan
            ['id' => 24, 'name' => 'Balikpapan', 'province' => 'Kalimantan Timur', 'type' => 'city'],
            ['id' => 25, 'name' => 'Banjarmasin', 'province' => 'Kalimantan Selatan', 'type' => 'city'],
            ['id' => 26, 'name' => 'Pontianak', 'province' => 'Kalimantan Barat', 'type' => 'city'],
            
            // Sulawesi
            ['id' => 27, 'name' => 'Makassar', 'province' => 'Sulawesi Selatan', 'type' => 'city'],
            ['id' => 28, 'name' => 'Manado', 'province' => 'Sulawesi Utara', 'type' => 'city'],
            
            // Bali & Nusa Tenggara
            ['id' => 29, 'name' => 'Denpasar', 'province' => 'Bali', 'type' => 'city'],
            ['id' => 30, 'name' => 'Mataram', 'province' => 'Nusa Tenggara Barat', 'type' => 'city'],
        ];

        // Filter berdasarkan query search
        $search = $request->get('search', '');
        if ($search) {
            $locations = array_filter($locations, function($location) use ($search) {
                return stripos($location['name'], $search) !== false || 
                       stripos($location['province'], $search) !== false;
            });
        }

        // Filter berdasarkan province
        $province = $request->get('province', '');
        if ($province) {
            $locations = array_filter($locations, function($location) use ($province) {
                return $location['province'] === $province;
            });
        }

        // Limit results
        $limit = $request->get('limit', 50);
        $locations = array_slice($locations, 0, $limit);

        return response()->json([
            'data' => array_values($locations),
            'total' => count($locations)
        ]);
    }

    /**
     * Get provinces
     */
    public function provinces()
    {
        $provinces = [
            'DKI Jakarta',
            'Jawa Barat', 
            'Jawa Tengah',
            'DI Yogyakarta',
            'Jawa Timur',
            'Banten',
            'Sumatra Utara',
            'Sumatra Selatan', 
            'Sumatra Barat',
            'Riau',
            'Kalimantan Timur',
            'Kalimantan Selatan',
            'Kalimantan Barat',
            'Sulawesi Selatan',
            'Sulawesi Utara',
            'Bali',
            'Nusa Tenggara Barat'
        ];

        return response()->json([
            'data' => $provinces
        ]);
    }
}