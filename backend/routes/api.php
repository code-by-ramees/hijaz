<?php

use App\Http\Controllers\ProductController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\Admin\AIController;
use App\Http\Controllers\BusinessSettingController;
use Illuminate\Support\Facades\Route;

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{product}', [ProductController::class, 'show']);
Route::post('/products', [ProductController::class, 'store']);
Route::match(['put', 'post'], '/products/{product}', [ProductController::class, 'update']);
Route::delete('/products/{product}', [ProductController::class, 'destroy']);
Route::post('/products/reset', [ProductController::class, 'reset']);

// ─── Review Routes ────────────────────────────────────────────────────────────
Route::get('/reviews', [ReviewController::class, 'index']);
Route::post('/reviews', [ReviewController::class, 'store']);
Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);

// ─── Order Routes ─────────────────────────────────────────────────────────────
Route::get('/orders', [OrderController::class, 'index']);
Route::post('/orders', [OrderController::class, 'store']);
Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
Route::delete('/orders/{id}', [OrderController::class, 'destroy']);

// ─── Message Routes (Contact Form) ────────────────────────────────────────────
Route::get('/messages', [MessageController::class, 'index']);
Route::post('/messages', [MessageController::class, 'store']);
Route::patch('/messages/{id}/status', [MessageController::class, 'updateStatus']);
Route::delete('/messages/{id}', [MessageController::class, 'destroy']);

// ─── Admin AI Assistant Routes ────────────────────────────────────────────────
Route::prefix('admin/ai')->group(function () {
    Route::post('/chat', [AIController::class, 'chat']);
    Route::get('/conversations', [AIController::class, 'getConversations']);
    Route::get('/conversations/{id}', [AIController::class, 'getConversation']);
    Route::delete('/conversations/{id}', [AIController::class, 'deleteConversation']);

    Route::get('/insights/overview', [AIController::class, 'getInsightsOverview']);
    Route::get('/insights/sales', [AIController::class, 'getSalesInsights']);
    Route::get('/insights/inventory', [AIController::class, 'getInventoryInsights']);
    Route::get('/insights/reviews', [AIController::class, 'getReviewInsights']);

    Route::post('/generate/product', [AIController::class, 'generateProductContent']);
    Route::post('/apply/product', [AIController::class, 'applyProductContent']);
});

// ─── Payment Routes ───────────────────────────────────────────────────────────
Route::get('/payment/key', [PaymentController::class, 'getKey']);
Route::post('/payment/create-order', [PaymentController::class, 'createOrder']);
Route::post('/payment/verify', [PaymentController::class, 'verifyPayment']);

// ─── Business Settings & Coupons ──────────────────────────────────────────────
Route::get('/settings', [BusinessSettingController::class, 'getSettings']);
Route::post('/settings', [BusinessSettingController::class, 'updateSettings']);

Route::get('/coupons', [BusinessSettingController::class, 'getCoupons']);
Route::post('/coupons', [BusinessSettingController::class, 'storeCoupon']);
Route::put('/coupons/{id}', [BusinessSettingController::class, 'updateCoupon']);
Route::delete('/coupons/{id}', [BusinessSettingController::class, 'destroyCoupon']);
Route::patch('/coupons/{id}/toggle', [BusinessSettingController::class, 'toggleCoupon']);
Route::post('/coupons/validate', [BusinessSettingController::class, 'validateCoupon']);