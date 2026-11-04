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
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('description')->nullable();
            $table->enum('discount_type', ['percent', 'fixed'])->default('percent');
            $table->decimal('discount_value', 10, 2);
            $table->decimal('min_order_amount', 10, 2)->default(0.00);
            $table->decimal('max_discount_amount', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('usage_limit')->nullable();
            $table->integer('used_count')->default(0);
            $table->date('expires_at')->nullable();
            $table->timestamps();
        });

        // Seed initial default coupons
        DB::table('coupons')->insert([
            [
                'code' => 'HIJAZ10',
                'description' => '10% Welcome discount on all luxury artisanal perfumes',
                'discount_type' => 'percent',
                'discount_value' => 10.00,
                'min_order_amount' => 0.00,
                'max_discount_amount' => 500.00,
                'is_active' => true,
                'usage_limit' => null,
                'used_count' => 0,
                'expires_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'ROYAL200',
                'description' => '₹200 Flat discount on orders above ₹1,499',
                'discount_type' => 'fixed',
                'discount_value' => 200.00,
                'min_order_amount' => 1499.00,
                'max_discount_amount' => null,
                'is_active' => true,
                'usage_limit' => 100,
                'used_count' => 0,
                'expires_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coupons');
    }
};
