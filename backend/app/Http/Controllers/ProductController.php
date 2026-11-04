<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Product;
use Database\Seeders\ProductSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index()
    {
        return response()->json(Product::with(['customerReviews' => function ($q) {
            $q->latest();
        }])->get()->values());
    }

    public function show(Product $product)
    {
        return response()->json($product->load(['customerReviews' => function ($q) {
            $q->latest();
        }]));
    }

    public function store(Request $request)
    {
        // Validate all non-file fields
        $request->validate([
            'category' => 'required|string',
            'bedding_type' => 'nullable|string',
            'name' => 'required|string',
            'subtitle' => 'nullable|string',
            'description' => 'nullable|string',
            'price' => 'required|numeric',
            'originalPrice' => 'nullable|numeric',
            'badge' => 'nullable|string',
            'rating' => 'nullable|numeric',
            'reviews' => 'nullable|integer',
            'image' => 'nullable',
            'images.*' => 'nullable',
            'extra_images.*' => 'nullable',
            'embed_urls' => 'nullable',
        ]);

        $data = $request->only([
            'category',
            'bedding_type',
            'name',
            'subtitle',
            'description',
            'price',
            'badge',
            'rating',
            'reviews',
        ]);

        // Process gallery / extra images
        $galleryImages = [];
        if ($request->has('existing_images')) {
            $existing = $request->input('existing_images');
            if (is_string($existing)) {
                $decoded = json_decode($existing, true);
                $existing = is_array($decoded) ? $decoded : [$existing];
            }
            if (is_array($existing)) {
                $galleryImages = array_merge($galleryImages, array_filter($existing));
            }
        }

        // Handle uploaded extra images
        $filesToProcess = [];
        if ($request->hasFile('extra_images')) {
            $filesToProcess = array_merge($filesToProcess, (array)$request->file('extra_images'));
        }
        if ($request->hasFile('images')) {
            $filesToProcess = array_merge($filesToProcess, (array)$request->file('images'));
        }

        $dest = public_path('images/products');
        if (!empty($filesToProcess) && !is_dir($dest)) {
            mkdir($dest, 0775, true);
        }

        foreach ($filesToProcess as $file) {
            if ($file && $file->isValid()) {
                $filename = uniqid('prod_extra_') . '.' . $file->getClientOriginalExtension();
                $file->move($dest, $filename);
                $galleryImages[] = '/images/products/' . $filename;
            }
        }

        // If images was passed as array of strings or JSON (e.g. from React admin without file uploads)
        if ($request->filled('images') && !$request->hasFile('images')) {
            $imgs = $request->input('images');
            if (is_string($imgs)) {
                $decoded = json_decode($imgs, true);
                $imgs = is_array($decoded) ? $decoded : [$imgs];
            }
            if (is_array($imgs)) {
                $galleryImages = array_merge($galleryImages, array_filter($imgs));
            }
        }

        // Handle main thumbnail image
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = uniqid('product_') . '.' . $file->getClientOriginalExtension();
            if (!is_dir($dest)) {
                mkdir($dest, 0775, true);
            }
            $file->move($dest, $filename);
            $mainImg = '/images/products/' . $filename;
            $data['image'] = $mainImg;
            array_unshift($galleryImages, $mainImg);
        } elseif ($request->filled('thumbnail_image')) {
            $data['image'] = $request->input('thumbnail_image');
        } elseif ($request->filled('thumbnail_index') && isset($galleryImages[(int)$request->input('thumbnail_index')])) {
            $data['image'] = $galleryImages[(int)$request->input('thumbnail_index')];
        } elseif ($request->filled('image')) {
            $data['image'] = $request->input('image');
        } elseif (!empty($galleryImages)) {
            $data['image'] = $galleryImages[0];
        }

        $data['images'] = array_values(array_unique(array_filter($galleryImages)));

        // Handle embed_urls (Instagram reels, youtube, etc.)
        if ($request->has('embed_urls')) {
            $rawEmbeds = $request->input('embed_urls');
            if (is_string($rawEmbeds)) {
                $decoded = json_decode($rawEmbeds, true);
                $rawEmbeds = is_array($decoded) ? $decoded : [$rawEmbeds];
            }
            if (is_array($rawEmbeds)) {
                $data['embed_urls'] = array_values(array_filter(array_map('trim', $rawEmbeds)));
            }
        } elseif ($request->filled('embed_url')) {
            $data['embed_urls'] = [trim($request->input('embed_url'))];
        }

        // Map camelCase originalPrice → snake_case original_price
        if ($request->filled('originalPrice')) {
            $data['original_price'] = $request->input('originalPrice');
        }

        $product = Product::create($data);

        // Optional admin-added review during creation
        if ($request->filled('review_customer_name') && $request->filled('review_comment')) {
            $rating = (float)($request->input('review_rating', 5));
            $sentiment = $rating <= 2.5 ? 'negative' : ($rating <= 3.5 ? 'neutral' : 'positive');
            \App\Models\Review::create([
                'product_id' => $product->id,
                'customer_name' => $request->input('review_customer_name'),
                'customer_email' => $request->input('review_customer_email', null),
                'rating' => $rating,
                'comment' => $request->input('review_comment'),
                'sentiment' => $sentiment,
            ]);
            $avg = \App\Models\Review::where('product_id', $product->id)->avg('rating');
            $count = \App\Models\Review::where('product_id', $product->id)->count();
            $product->rating = $avg ? round((float)$avg, 1) : 5.0;
            $product->reviews = $count;
            $product->save();
        }

        return response()->json($product->load('customerReviews'), 201);
    }

    public function update(Request $request, Product $product)
    {
        $request->validate([
            'category' => 'sometimes|required|string',
            'bedding_type' => 'nullable|string',
            'name' => 'sometimes|required|string',
            'subtitle' => 'nullable|string',
            'description' => 'nullable|string',
            'price' => 'sometimes|required|numeric',
            'originalPrice' => 'nullable|numeric',
            'badge' => 'nullable|string',
            'rating' => 'nullable|numeric',
            'reviews' => 'nullable|integer',
            'image' => 'nullable',
            'images.*' => 'nullable',
            'extra_images.*' => 'nullable',
            'embed_urls' => 'nullable',
        ]);

        $data = $request->only([
            'category',
            'bedding_type',
            'name',
            'subtitle',
            'description',
            'price',
            'badge',
            'rating',
            'reviews',
        ]);

        // Process gallery images
        $galleryImages = is_array($product->images) ? $product->images : [];
        if ($request->has('existing_images')) {
            $existing = $request->input('existing_images');
            if (is_string($existing)) {
                $decoded = json_decode($existing, true);
                $existing = is_array($decoded) ? $decoded : [$existing];
            }
            if (is_array($existing)) {
                $galleryImages = array_values(array_filter($existing));
            }
        }

        // Handle uploaded extra images
        $filesToProcess = [];
        if ($request->hasFile('extra_images')) {
            $filesToProcess = array_merge($filesToProcess, (array)$request->file('extra_images'));
        }
        if ($request->hasFile('images')) {
            $filesToProcess = array_merge($filesToProcess, (array)$request->file('images'));
        }

        $dest = public_path('images/products');
        if (!empty($filesToProcess) && !is_dir($dest)) {
            mkdir($dest, 0775, true);
        }

        foreach ($filesToProcess as $file) {
            if ($file && $file->isValid()) {
                $filename = uniqid('prod_extra_') . '.' . $file->getClientOriginalExtension();
                $file->move($dest, $filename);
                $galleryImages[] = '/images/products/' . $filename;
            }
        }

        // If images was passed as array of strings or JSON
        if ($request->filled('images') && !$request->hasFile('images')) {
            $imgs = $request->input('images');
            if (is_string($imgs)) {
                $decoded = json_decode($imgs, true);
                $imgs = is_array($decoded) ? $decoded : [$imgs];
            }
            if (is_array($imgs)) {
                $galleryImages = array_merge($galleryImages, array_filter($imgs));
            }
        }

        // Handle main thumbnail image
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = uniqid('product_') . '.' . $file->getClientOriginalExtension();
            if (!is_dir($dest)) {
                mkdir($dest, 0775, true);
            }
            $file->move($dest, $filename);
            $mainImg = '/images/products/' . $filename;
            $data['image'] = $mainImg;
            array_unshift($galleryImages, $mainImg);
        } elseif ($request->filled('thumbnail_image')) {
            $data['image'] = $request->input('thumbnail_image');
        } elseif ($request->filled('thumbnail_index') && isset($galleryImages[(int)$request->input('thumbnail_index')])) {
            $data['image'] = $galleryImages[(int)$request->input('thumbnail_index')];
        } elseif ($request->has('image') && $request->filled('image')) {
            $data['image'] = $request->input('image');
        }

        if ($request->has('images') || $request->has('existing_images') || !empty($filesToProcess)) {
            $data['images'] = array_values(array_unique(array_filter($galleryImages)));
        }

        // Handle embed_urls
        if ($request->has('embed_urls')) {
            $rawEmbeds = $request->input('embed_urls');
            if (is_string($rawEmbeds)) {
                $decoded = json_decode($rawEmbeds, true);
                $rawEmbeds = is_array($decoded) ? $decoded : [$rawEmbeds];
            }
            if (is_array($rawEmbeds)) {
                $data['embed_urls'] = array_values(array_filter(array_map('trim', $rawEmbeds)));
            }
        } elseif ($request->filled('embed_url')) {
            $data['embed_urls'] = [trim($request->input('embed_url'))];
        }

        // Map camelCase originalPrice → snake_case original_price
        if ($request->has('originalPrice')) {
            $data['original_price'] = $request->input('originalPrice');
        }

        $product->update($data);

        // Optional admin-added review during update
        if ($request->filled('review_customer_name') && $request->filled('review_comment')) {
            $rating = (float)($request->input('review_rating', 5));
            $sentiment = $rating <= 2.5 ? 'negative' : ($rating <= 3.5 ? 'neutral' : 'positive');
            \App\Models\Review::create([
                'product_id' => $product->id,
                'customer_name' => $request->input('review_customer_name'),
                'customer_email' => $request->input('review_customer_email', null),
                'rating' => $rating,
                'comment' => $request->input('review_comment'),
                'sentiment' => $sentiment,
            ]);
            $avg = \App\Models\Review::where('product_id', $product->id)->avg('rating');
            $count = \App\Models\Review::where('product_id', $product->id)->count();
            $product->rating = $avg ? round((float)$avg, 1) : 5.0;
            $product->reviews = $count;
            $product->save();
        }

        return response()->json($product->fresh()->load('customerReviews'));
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(null, 204);
    }

    public function reset()
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');
            Product::truncate();
            DB::statement('PRAGMA foreign_keys = ON;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            Product::truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }

        return response()->json(['message' => 'All products have been cleared.']);
    }
}
