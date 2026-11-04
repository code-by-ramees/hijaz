<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    /**
     * Display a listing of orders (all for admin, or filtered by user_uid).
     */
    public function index(Request $request)
    {
        $query = Order::query()->orderBy('created_at', 'desc');

        if ($request->filled('user_uid')) {
            $query->where('user_uid', $request->query('user_uid'));
        }

        if ($request->filled('status') && $request->query('status') !== 'ALL') {
            $query->where('status', $request->query('status'));
        }

        $orders = $query->get();
        return response()->json($orders);
    }

    /**
     * Store a newly created order in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_number'    => 'required|string',
            'user_uid'        => 'nullable|string',
            'customer_name'   => 'required|string',
            'customer_email'  => 'nullable|string',
            'customer_phone'  => 'nullable|string',
            'shipping_address'=> 'required|string',
            'address_type'    => 'nullable|string',
            'payment_method'  => 'nullable|string',
            'payment_status'  => 'nullable|string',
            'status'          => 'nullable|string',
            'subtotal'        => 'nullable|numeric',
            'discount'        => 'nullable|numeric',
            'shipping_fee'    => 'nullable|numeric',
            'total_amount'    => 'required|numeric',
            'items'           => 'required|array',
        ]);

        // Default values
        $validated['address_type']   = $validated['address_type'] ?? 'Home';
        $validated['payment_method'] = $validated['payment_method'] ?? 'cod';
        $validated['payment_status'] = $validated['payment_status'] ?? 'pending';
        $validated['status']         = $validated['status'] ?? 'Processing';
        $validated['subtotal']       = $validated['subtotal'] ?? $validated['total_amount'];
        $validated['discount']       = $validated['discount'] ?? 0;
        $validated['shipping_fee']   = $validated['shipping_fee'] ?? 0;

        // If an order with same order_number already exists, update or return it
        $order = Order::updateOrCreate(
            ['order_number' => $validated['order_number']],
            $validated
        );

        if ($request->filled('coupon_code')) {
            \App\Models\Coupon::where('code', strtoupper(trim($request->coupon_code)))->increment('used_count');
        }

        return response()->json($order, 201);
    }

    /**
     * Display the specified order.
     */
    public function show(Order $order)
    {
        return response()->json($order);
    }

    /**
     * Update the status of an order.
     */
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Processing,Shipped,Delivered,Cancelled',
        ]);

        $order = Order::findOrFail($id);
        $order->status = $validated['status'];
        if ($validated['status'] === 'Delivered') {
            $order->payment_status = 'paid';
        }
        $order->save();

        return response()->json($order);
    }

    /**
     * Remove the specified order from storage.
     */
    public function destroy($id)
    {
        $order = Order::findOrFail($id);
        $order->delete();

        return response()->json(['message' => 'Order deleted successfully']);
    }
}
