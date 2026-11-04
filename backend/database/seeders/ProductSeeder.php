<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // No default seeder product data
        $products = [];

        foreach ($products as $category => $list) {
            foreach ($list as $prod) {
                Product::create(array_merge($prod, ['category' => $category]));
            }
        }
    }
}
