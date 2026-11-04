<?php

namespace App\Services\AI;

use App\Models\Product;
use App\Models\Review;

class AIReviewService
{
    /**
     * Get review analytics across the entire store.
     */
    public function getAllReviewsAnalytics(): array
    {
        $reviews = Review::with('product')->get();
        $totalReviews = $reviews->count();

        if ($totalReviews === 0) {
            return [
                'total_reviews' => 0,
                'average_store_rating' => 5.0,
                'sentiment_breakdown' => ['positive' => 100, 'neutral' => 0, 'negative' => 0],
                'common_praises' => ['Luxurious aroma', 'Premium packaging'],
                'common_complaints' => [],
                'recent_feedback' => [],
            ];
        }

        $avgRating = round($reviews->avg('rating'), 2);
        $positiveCount = $reviews->where('sentiment', 'positive')->count();
        $neutralCount = $reviews->where('sentiment', 'neutral')->count();
        $negativeCount = $reviews->where('sentiment', 'negative')->count();

        $positivePct = round(($positiveCount / $totalReviews) * 100, 1);
        $neutralPct = round(($neutralCount / $totalReviews) * 100, 1);
        $negativePct = round(($negativeCount / $totalReviews) * 100, 1);

        $praises = [];
        $complaints = [];

        foreach ($reviews as $rev) {
            $comment = strtolower($rev->comment);
            if (str_contains($comment, 'quality') || str_contains($comment, 'luxurious') || str_contains($comment, 'long-lasting') || str_contains($comment, 'projection') || str_contains($comment, 'packaging')) {
                $praises[] = $rev->comment;
            }
            if (str_contains($comment, 'small') || str_contains($comment, 'delay') || str_contains($comment, 'delivery') || str_contains($comment, 'price') || str_contains($comment, 'issue')) {
                $complaints[] = [
                    'product_name' => $rev->product->name ?? 'Store Product',
                    'customer' => $rev->customer_name,
                    'rating' => $rev->rating,
                    'issue' => $rev->comment,
                ];
            }
        }

        return [
            'total_reviews' => $totalReviews,
            'average_store_rating' => $avgRating,
            'sentiment_breakdown' => [
                'positive_percentage' => $positivePct,
                'neutral_percentage' => $neutralPct,
                'negative_percentage' => $negativePct,
                'positive_count' => $positiveCount,
                'neutral_count' => $neutralCount,
                'negative_count' => $negativeCount,
            ],
            'common_praises' => array_slice(array_unique($praises), 0, 4),
            'common_complaints' => array_slice($complaints, 0, 5),
            'recent_feedback' => $reviews->take(6)->map(fn ($r) => [
                'id' => $r->id,
                'product_name' => $r->product->name ?? 'Product',
                'customer' => $r->customer_name,
                'rating' => $r->rating,
                'sentiment' => $r->sentiment,
                'comment' => $r->comment,
                'date' => $r->created_at->format('M d, Y'),
            ])->toArray(),
        ];
    }

    /**
     * Get review analytics for a specific product.
     */
    public function getProductReviewsSummary(int $productId): array
    {
        $product = Product::with('customerReviews')->find($productId);
        if (!$product) {
            return ['error' => 'Product not found'];
        }

        $reviews = $product->customerReviews;
        $total = $reviews->count();

        if ($total === 0) {
            return [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'total_reviews' => 0,
                'average_rating' => (float) $product->rating,
                'summary' => "No dedicated reviews submitted yet for {$product->name}. Current catalog rating is {$product->rating} stars.",
                'complaints' => [],
            ];
        }

        $avg = round($reviews->avg('rating'), 2);
        $complaints = $reviews->where('sentiment', 'negative')->pluck('comment')->toArray();
        $praises = $reviews->where('sentiment', 'positive')->pluck('comment')->toArray();

        return [
            'product_id' => $product->id,
            'product_name' => $product->name,
            'total_reviews' => $total,
            'average_rating' => $avg,
            'praises' => $praises,
            'complaints' => $complaints,
            'summary' => "Customers rated {$product->name} an average of {$avg}/5. " . (count($praises) > 0 ? "Praised for: " . implode('; ', array_slice($praises, 0, 2)) : ""),
        ];
    }
}
