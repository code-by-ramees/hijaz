<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Review;
use Illuminate\Database\Seeder;

class AdminAIDataSeeder extends Seeder
{
    public function run(): void
    {
        $products = Product::all();

        if ($products->isEmpty()) {
            return;
        }

        // Set realistic stock and thresholds
        foreach ($products as $index => $product) {
            // Assign varying realistic stock levels
            if ($index === 0) {
                $product->stock = 3; // Low stock alert!
                $product->low_stock_threshold = 5;
            } elseif ($index === 1) {
                $product->stock = 4; // Low stock alert!
                $product->low_stock_threshold = 5;
            } elseif ($index === 2) {
                $product->stock = 0; // Out of stock!
                $product->low_stock_threshold = 5;
            } else {
                $product->stock = rand(15, 60);
                $product->low_stock_threshold = 5;
            }
            $product->save();

            // Seed reviews if none exist
            if ($product->customerReviews()->count() === 0) {
                $sampleReviews = [
                    [
                        'customer_name' => 'Faris Al-Mansoor',
                        'customer_email' => 'faris@example.com',
                        'rating' => 5.0,
                        'comment' => 'Exceptional quality and long-lasting sillage. The scent projection is royal and luxurious.',
                        'sentiment' => 'positive',
                    ],
                    [
                        'customer_name' => 'Zahra Karim',
                        'customer_email' => 'zahra@example.com',
                        'rating' => 4.8,
                        'comment' => 'Beautiful packaging and rich texture. Highly recommend for gifting.',
                        'sentiment' => 'positive',
                    ],
                    [
                        'customer_name' => 'Omar Siddiqui',
                        'customer_email' => 'omar@example.com',
                        'rating' => 3.5,
                        'comment' => 'Good product overall, but delivery took two days longer than estimated in my area.',
                        'sentiment' => 'neutral',
                    ],
                ];

                if ($index === 0) {
                    $sampleReviews[] = [
                        'customer_name' => 'Tariq N.',
                        'customer_email' => 'tariq@example.com',
                        'rating' => 2.5,
                        'comment' => 'The bottle size is a bit smaller than expected for the premium price tag.',
                        'sentiment' => 'negative',
                    ];
                }

                foreach ($sampleReviews as $rev) {
                    Review::create(array_merge($rev, ['product_id' => $product->id]));
                }
            }
        }
    }
}
