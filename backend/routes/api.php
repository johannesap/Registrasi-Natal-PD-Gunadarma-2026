<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\RegistrationController;

// Public Health & Statistics
Route::get('/health', [RegistrationController::class, 'health']);
Route::get('/stats', [RegistrationController::class, 'stats']);

// Public User Registration (NO LOGIN REQUIRED)
Route::post('/register', [RegistrationController::class, 'store']);

// Registrations CRUD & Verification
Route::get('/registrations', [RegistrationController::class, 'index']);
Route::get('/registrations/{ticketId}', [RegistrationController::class, 'show']);
Route::patch('/registrations/{ticketId}/checkin', [RegistrationController::class, 'toggleCheckIn']);
Route::delete('/registrations/{ticketId}', [RegistrationController::class, 'destroy']);

// Admin Authentication & CSV Export
Route::post('/admin/login', [RegistrationController::class, 'adminLogin']);
Route::get('/export', [RegistrationController::class, 'exportCsv']);
