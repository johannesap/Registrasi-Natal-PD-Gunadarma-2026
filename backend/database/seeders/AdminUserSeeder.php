<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Repo ini publik dan database dipakai production, jadi password tidak boleh ditulis di kode
        $password = env('ADMIN_SEED_PASSWORD');
        if (! $password) {
            throw new \RuntimeException('Set ADMIN_SEED_PASSWORD di .env sebelum menjalankan AdminUserSeeder.');
        }

        // 1. Akun Admin Utama
        User::updateOrCreate(
            ['email' => 'admin@gunadarma.ac.id'],
            [
                'name' => 'admin',
                'password' => Hash::make($password),
            ]
        );

        // 2. Akun Panitia Kesekretariatan Tambahan
        User::updateOrCreate(
            ['email' => 'sekretariat@natalpd2026.com'],
            [
                'name' => 'sekretariat',
                'password' => Hash::make($password),
            ]
        );
    }
}
