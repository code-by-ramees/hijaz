<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusinessSetting extends Model
{
    use HasFactory;

    protected $table = 'business_settings';

    protected $fillable = [
        'shipping_fee',
        'free_shipping_threshold',
        'free_shipping_enabled',
        'estimated_delivery_days',
        'business_name',
        'support_email',
        'support_phone',
        'tax_percentage',
    ];

    protected $casts = [
        'shipping_fee' => 'float',
        'free_shipping_threshold' => 'float',
        'free_shipping_enabled' => 'boolean',
        'tax_percentage' => 'float',
    ];

    /**
     * Get or create current settings instance.
     */
    public static function current(): self
    {
        return static::firstOrCreate([], [
            'shipping_fee' => 99.00,
            'free_shipping_threshold' => 999.00,
            'free_shipping_enabled' => true,
            'estimated_delivery_days' => '2 - 4 Business Days',
            'business_name' => 'HIJAZ Luxury Fragrances',
            'support_email' => 'care@hijazperfumes.com',
            'support_phone' => '+91 98765 43210',
            'tax_percentage' => 0.00,
        ]);
    }
}
