<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_id', 50)->unique();
            $table->string('full_name', 150);
            $table->string('npm', 8);
            $table->string('email', 150);
            $table->string('whatsapp', 20);
            $table->string('region', 50)->default('depok');
            $table->string('komsel_status', 150)->nullable();
            $table->string('mentor_name', 150)->default('-');
            $table->string('faculty', 150)->default('Universitas Gunadarma');
            $table->string('session', 100)->default('Sesi Utama (16.30 WIB - Selesai)');
            $table->boolean('is_checked_in')->default(false);
            $table->timestamp('checked_in_at')->nullable();
            $table->string('registered_at', 50)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};
