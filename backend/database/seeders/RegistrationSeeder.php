<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Registration;

class RegistrationSeeder extends Seeder
{
    public function run(): void
    {
        $seeds = [
            [
                'ticket_id' => 'NATAL-UG-4102-1890',
                'full_name' => 'Jonathan Kevin Situmorang',
                'npm' => '50421890',
                'email' => 'jonathan.kevin@gmail.com',
                'whatsapp' => '081298765432',
                'region' => 'depok',
                'komsel_status' => 'Sudah memiliki Komsel (Tuliskan nama Kakak Komsel di bawah)',
                'mentor_name' => 'Kak Daniel Simanjuntak',
                'faculty' => 'Teknik Informatika / FTI',
                'session' => 'Sesi Utama (16.30 WIB - Selesai)',
                'registered_at' => '01/10/2026, 14.32',
                'is_checked_in' => true,
                'checked_in_at' => '2026-10-01 16:15:00',
            ],
            [
                'ticket_id' => 'NATAL-UG-5289-4412',
                'full_name' => 'Maria Gabriella Samosir',
                'npm' => '20224412',
                'email' => 'gabriella.maria@gunadarma.ac.id',
                'whatsapp' => '081345678910',
                'region' => 'kalimalang',
                'komsel_status' => 'Sudah memiliki Komsel (Tuliskan nama Kakak Komsel di bawah)',
                'mentor_name' => 'Kak Yohana Priskila',
                'faculty' => 'Sistem Informasi / FIKTI',
                'session' => 'Sesi Utama (16.30 WIB - Selesai)',
                'registered_at' => '01/10/2026, 16.45',
                'is_checked_in' => false,
                'checked_in_at' => null,
            ],
            [
                'ticket_id' => 'NATAL-UG-6714-9021',
                'full_name' => 'Christian Timothy Siregar',
                'npm' => '10129021',
                'email' => 'christian.timothy@gmail.com',
                'whatsapp' => '085712349876',
                'region' => 'karawaci',
                'komsel_status' => 'Belum memiliki Komsel (Rindu bergabung dengan Komsel PD)',
                'mentor_name' => '-',
                'faculty' => 'Manajemen / FE',
                'session' => 'Sesi Utama (16.30 WIB - Selesai)',
                'registered_at' => '02/10/2026, 09.15',
                'is_checked_in' => true,
                'checked_in_at' => '2026-10-02 16:20:00',
            ],
            [
                'ticket_id' => 'NATAL-UG-7831-3310',
                'full_name' => 'Rachel Michelle Hutapea',
                'npm' => '30423310',
                'email' => 'rachel.hutapea@gmail.com',
                'whatsapp' => '081287654321',
                'region' => 'depok',
                'komsel_status' => 'Sudah memiliki Komsel (Tuliskan nama Kakak Komsel di bawah)',
                'mentor_name' => 'Kak Samuel Pasaribu',
                'faculty' => 'Psikologi / FPSI',
                'session' => 'Sesi Utama (16.30 WIB - Selesai)',
                'registered_at' => '02/10/2026, 11.20',
                'is_checked_in' => false,
                'checked_in_at' => null,
            ],
            [
                'ticket_id' => 'NATAL-UG-8920-7761',
                'full_name' => 'David Samuel Tampubolon',
                'npm' => '51427761',
                'email' => 'david.samuel@gunadarma.ac.id',
                'whatsapp' => '087812903456',
                'region' => 'cengkareng',
                'komsel_status' => 'Belum memiliki Komsel (Rindu bergabung dengan Komsel PD)',
                'mentor_name' => '-',
                'faculty' => 'Teknik Elektro / FTI',
                'session' => 'Sesi Utama (16.30 WIB - Selesai)',
                'registered_at' => '03/10/2026, 13.05',
                'is_checked_in' => false,
                'checked_in_at' => null,
            ],
            [
                'ticket_id' => 'NATAL-UG-9145-2026',
                'full_name' => 'Grace Stefanie Panjaitan',
                'npm' => '21225510',
                'email' => 'grace.stefanie@gmail.com',
                'whatsapp' => '082198761234',
                'region' => 'simatupang',
                'komsel_status' => 'Sudah memiliki Komsel (Tuliskan nama Kakak Komsel di bawah)',
                'mentor_name' => 'Kak Grace Novita',
                'faculty' => 'Ilmu Komunikasi / FIKOM',
                'session' => 'Sesi Utama (16.30 WIB - Selesai)',
                'registered_at' => '03/10/2026, 15.50',
                'is_checked_in' => false,
                'checked_in_at' => null,
            ],
        ];

        foreach ($seeds as $data) {
            Registration::updateOrCreate(['ticket_id' => $data['ticket_id']], $data);
        }
    }
}
