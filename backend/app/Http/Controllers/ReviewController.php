<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    // GET /api/reviews — List all reviews (newest first)
    public function index(Request $request)
    {
        $query = Review::with(['product:id,name,category,image,badge'])->latest();

        if ($request->filled('rating') && $request->rating !== 'ALL') {
            $query->where('rating', '>=', (float)$request->rating)
                  ->where('rating', '<', (float)$request->rating + 1);
        }

        if ($request->filled('sentiment') && $request->sentiment !== 'ALL') {
            $query->where('sentiment', strtolower($request->sentiment));
        }

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_email', 'like', "%{$search}%")
                  ->orWhere('comment', 'like', "%{$search}%")
                  ->orWhereHas('product', function ($pq) use ($search) {
                      $pq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $reviews = $query->get();

        return response()->json($reviews);
    }

    // POST /api/reviews — Store a new review
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name'  => 'required|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'user_uid'       => 'nullable|string|max:255',
            'product_id'     => 'nullable|exists:products,id',
            'rating'         => 'required|numeric|min:1|max:5',
            'comment'        => 'required|string|min:3|max:2000',
        ]);

        $rating = (float) $validated['rating'];
        $sentiment = 'positive';
        if ($rating <= 2.5) {
            $sentiment = 'negative';
        } elseif ($rating <= 3.5) {
            $sentiment = 'neutral';
        }

        $review = Review::create([
            'customer_name'  => $validated['customer_name'],
            'customer_email' => $validated['customer_email'] ?? null,
            'user_uid'       => $validated['user_uid'] ?? null,
            'product_id'     => $validated['product_id'] ?? null,
            'rating'         => $rating,
            'comment'        => $validated['comment'],
            'sentiment'      => $sentiment,
        ]);

        // If tied to a product, sync product average rating and count
        if ($review->product_id) {
            $this->syncProductRating($review->product_id);
        }

        $review->load(['product:id,name,category,image,badge']);

        return response()->json($review, 201);
    }

    // DELETE /api/reviews/{id} — Delete a review
    public function destroy($id)
    {
        $review = Review::findOrFail($id);
        $productId = $review->product_id;

        $review->delete();

        if ($productId) {
            $this->syncProductRating($productId);
        }

        return response()->json([
            'deleted' => true,
            'message' => 'Review deleted successfully',
        ]);
    }

    // Helper: update product rating and reviews count
    private function syncProductRating($productId)
    {
        $product = Product::find($productId);
        if (!$product) return;

        $avg = Review::where('product_id', $productId)->avg('rating');
        $count = Review::where('product_id', $productId)->count();

        $product->rating = $avg ? round((float)$avg, 1) : 5.0;
        $product->reviews = $count;
        $product->save();
    }
}
