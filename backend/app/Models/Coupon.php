<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'description',
        'discount_type',
        'discount_value',
        'min_order_amount',
        'max_discount_amount',
        'is_active',
        'usage_limit',
        'used_count',
        'expires_at',
    ];

    protected $casts = [
        'discount_value' => 'float',
        'min_order_amount' => 'float',
        'max_discount_amount' => 'float',
        'is_active' => 'boolean',
        'usage_limit' => 'integer',
        'used_count' => 'integer',
        'expires_at' => 'date',
    ];

    /**
     * Calculate discount for a given cart subtotal.
     */
    public function calculateDiscount(float $subtotal): float
    {
        if ($this->discount_type === 'percent') {
            $discount = ($subtotal * $this->discount_value) / 100;
            if ($this->max_discount_amount && $discount > $this->max_discount_amount) {
                $discount = $this->max_discount_amount;
            }
            return round($discount, 2);
        }

        // Fixed discount
        return round(min($this->discount_value, $subtotal), 2);
    }

    /**
     * Check if coupon is currently valid.
     */
    public function isValidFor(float $subtotal, ?string &$errorMessage = null): bool
    {
        if (!$this->is_active) {
            $errorMessage = 'This coupon code is currently disabled.';
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            $errorMessage = 'This coupon code has expired.';
            return false;
        }

        if ($this->usage_limit !== null && $this->used_count >= $this->usage_limit) {
            $errorMessage = 'This coupon has reached its maximum redemption limit.';
            return false;
        }

        if ($this->min_order_amount > 0 && $subtotal < $this->min_order_amount) {
            $errorMessage = "Minimum order amount of ₹" . number_format($this->min_order_amount) . " required for this coupon.";
            return false;
        }

        return true;
    }
}
