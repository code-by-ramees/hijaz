<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'stock')) {
                $table->integer('stock')->default(25)->after('reviews');
            }
            if (!Schema::hasColumn('products', 'low_stock_threshold')) {
                $table->integer('low_stock_threshold')->default(5)->after('stock');
            }
            if (!Schema::hasColumn('products', 'seo_title')) {
                $table->string('seo_title')->nullable()->after('low_stock_threshold');
            }
            if (!Schema::hasColumn('products', 'seo_description')) {
                $table->text('seo_description')->nullable()->after('seo_title');
            }
            if (!Schema::hasColumn('products', 'seo_keywords')) {
                $table->text('seo_keywords')->nullable()->after('seo_description');
            }
            if (!Schema::hasColumn('products', 'features')) {
                $table->text('features')->nullable()->after('seo_keywords');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'stock',
                'low_stock_threshold',
                'seo_title',
                'seo_description',
                'seo_keywords',
                'features',
            ]);
        });
    }
};
