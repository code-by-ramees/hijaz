<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'user_uid',
        'customer_name',
        'customer_email',
        'customer_phone',
        'shipping_address',
        'address_type',
        'payment_method',
        'payment_status',
        'status',
        'subtotal',
        'discount',
        'shipping_fee',
        'total_amount',
        'items',
    ];

    protected $casts = [
        'items' => 'array',
        'subtotal' => 'float',
        'discount' => 'float',
        'shipping_fee' => 'float',
        'total_amount' => 'float',
    ];

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }
}
