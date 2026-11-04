<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'customer_name',
        'customer_email',
        'user_uid',
        'rating',
        'comment',
        'sentiment',
    ];

    protected $casts = [
        'rating' => 'float',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
