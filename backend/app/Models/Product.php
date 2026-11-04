<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Product extends Model
{
    protected $fillable = [
        'category',
        'bedding_type',
        'name',
        'subtitle',
        'description',
        'price',
        'original_price',
        'image',
        'images',
        'embed_urls',
        'badge',
        'rating',
        'reviews',
        'stock',
        'low_stock_threshold',
        'seo_title',
        'seo_description',
        'seo_keywords',
        'features',
    ];

    protected $casts = [
        'price' => 'float',
        'original_price' => 'float',
        'rating' => 'float',
        'reviews' => 'integer',
        'stock' => 'integer',
        'low_stock_threshold' => 'integer',
        'images' => 'array',
        'embed_urls' => 'array',
    ];

    public function customerReviews()
    {
        return $this->hasMany(Review::class, 'product_id');
    }

    // Append camelCase originalPrice to JSON
    protected $appends = ['originalPrice'];

    // Hide the snake_case column from serialized JSON
    protected $hidden = ['original_price'];

    /**
     * Expose original_price as originalPrice in JSON output.
     * Using direct attributes array access to avoid recursive __get() calls.
     */
    public function getOriginalPriceAttribute(): float|null
    {
        $val = $this->attributes['original_price'] ?? null;
        return $val !== null ? (float) $val : null;
    }

    /**
     * Allow setting originalPrice (camelCase) from the controller.
     */
    public function setOriginalPriceAttribute(mixed $value): void
    {
        $this->attributes['original_price'] = $value;
    }
}
