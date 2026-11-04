<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('business_settings', function (Blueprint $table) {
            $table->id();
            $table->decimal('shipping_fee', 10, 2)->default(99.00);
            $table->decimal('free_shipping_threshold', 10, 2)->default(999.00);
            $table->boolean('free_shipping_enabled')->default(true);
            $table->string('estimated_delivery_days')->default('2 - 4 Business Days');
            $table->string('business_name')->default('HIJAZ Fragrances');
            $table->string('support_email')->default('care@hijazperfumes.com');
            $table->string('support_phone')->default('+91 98765 43210');
            $table->decimal('tax_percentage', 5, 2)->default(0.00);
            $table->timestamps();
        });

        // Seed initial default record
        DB::table('business_settings')->insert([
            'shipping_fee' => 99.00,
            'free_shipping_threshold' => 999.00,
            'free_shipping_enabled' => true,
            'estimated_delivery_days' => '2 - 4 Business Days',
            'business_name' => 'HIJAZ Luxury Fragrances',
            'support_email' => 'care@hijazperfumes.com',
            'support_phone' => '+91 98765 43210',
            'tax_percentage' => 0.00,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_settings');
    }
};
