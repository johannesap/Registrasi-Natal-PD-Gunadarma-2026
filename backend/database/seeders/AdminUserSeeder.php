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
        // 1. Akun Admin Utama
        User::updateOrCreate(
            ['email' => 'admin@gunadarma.ac.id'],
            [
                'name' => 'admin',
                'password' => Hash::make('natal2026'),
            ]
        );

        // 2. Akun Panitia Kesekretariatan Tambahan
        User::updateOrCreate(
            ['email' => 'sekretariat@natalpd2026.com'],
            [
                'name' => 'sekretariat',
                'password' => Hash::make('natal2026'),
            ]
        );
    }
}
