<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Order;
use App\Models\Review;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function index()
    {
        $products = Product::all();
        $orders = Order::orderBy('created_at', 'desc')->get();
        $reviews = Review::with('product')->orderBy('created_at', 'desc')->get();
        return view('admin.index', compact('products', 'orders', 'reviews'));
    }
}
