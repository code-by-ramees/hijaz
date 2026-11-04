<?php

namespace App\Http\Controllers;

use App\Models\BusinessSetting;
use App\Models\Coupon;
use Illuminate\Http\Request;

class BusinessSettingController extends Controller
{
    /**
     * Get current business settings (public for frontend & admin).
     */
    public function getSettings()
    {
        $settings = BusinessSetting::current();
        return response()->json($settings)
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    /**
     * Update business settings (Admin).
     */
    public function updateSettings(Request $request)
    {
        $freeShippingEnabled = $request->boolean('free_shipping_enabled');
        $request->merge(['free_shipping_enabled' => $freeShippingEnabled]);

        $validated = $request->validate([
            'shipping_fee'            => 'required|numeric|min:0',
            'free_shipping_threshold' => 'required|numeric|min:0',
            'free_shipping_enabled'   => 'required|boolean',
            'estimated_delivery_days' => 'nullable|string|max:100',
            'business_name'           => 'nullable|string|max:150',
            'support_email'          => 'nullable|string|max:150',
            'support_phone'          => 'nullable|string|max:50',
            'tax_percentage'         => 'nullable|numeric|min:0|max:100',
        ]);

        $settings = BusinessSetting::current();
        $settings->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Business settings updated successfully.',
            'settings' => $settings->fresh(),
        ]);
    }

    /**
     * Get all coupon codes (Admin).
     */
    public function getCoupons()
    {
        $coupons = Coupon::orderBy('created_at', 'desc')->get();
        return response()->json($coupons);
    }

    /**
     * Create a new coupon (Admin).
     */
    public function storeCoupon(Request $request)
    {
        $validated = $request->validate([
            'code'                => 'required|string|max:50|unique:coupons,code',
            'description'         => 'nullable|string|max:255',
            'discount_type'       => 'required|string|in:percent,fixed',
            'discount_value'      => 'required|numeric|min:0.01',
            'min_order_amount'    => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'is_active'           => 'nullable|boolean',
            'usage_limit'         => 'nullable|integer|min:1',
            'expires_at'          => 'nullable|date',
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));
        $validated['min_order_amount'] = $validated['min_order_amount'] ?? 0;
        $validated['is_active'] = $validated['is_active'] ?? true;

        $coupon = Coupon::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Coupon created successfully.',
            'coupon'  => $coupon,
        ], 201);
    }

    /**
     * Update an existing coupon (Admin).
     */
    public function updateCoupon(Request $request, $id)
    {
        $coupon = Coupon::findOrFail($id);

        $validated = $request->validate([
            'code'                => 'required|string|max:50|unique:coupons,code,' . $coupon->id,
            'description'         => 'nullable|string|max:255',
            'discount_type'       => 'required|string|in:percent,fixed',
            'discount_value'      => 'required|numeric|min:0.01',
            'min_order_amount'    => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'is_active'           => 'nullable|boolean',
            'usage_limit'         => 'nullable|integer|min:1',
            'expires_at'          => 'nullable|date',
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));

        $coupon->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Coupon updated successfully.',
            'coupon'  => $coupon->fresh(),
        ]);
    }

    /**
     * Toggle coupon active/inactive status (Admin).
     */
    public function toggleCoupon($id)
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->is_active = !$coupon->is_active;
        $coupon->save();

        return response()->json([
            'success' => true,
            'message' => $coupon->is_active ? 'Coupon activated.' : 'Coupon deactivated.',
            'coupon'  => $coupon,
        ]);
    }

    /**
     * Delete a coupon (Admin).
     */
    public function destroyCoupon($id)
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->delete();

        return response()->json([
            'success' => true,
            'message' => 'Coupon deleted successfully.',
        ]);
    }

    /**
     * Validate and calculate coupon discount for Cart / Checkout.
     */
    public function validateCoupon(Request $request)
    {
        $request->validate([
            'code'     => 'required|string',
            'subtotal' => 'required|numeric|min:0',
        ]);

        $code = strtoupper(trim($request->code));
        $subtotal = (float) $request->subtotal;

        $coupon = Coupon::where('code', $code)->first();

        if (!$coupon) {
            return response()->json([
                'valid'   => false,
                'message' => "Coupon '{$code}' not found.",
            ], 404);
        }

        $errorMessage = null;
        if (!$coupon->isValidFor($subtotal, $errorMessage)) {
            return response()->json([
                'valid'   => false,
                'message' => $errorMessage,
            ], 422);
        }

        $discountAmount = $coupon->calculateDiscount($subtotal);

        return response()->json([
            'valid'           => true,
            'code'            => $coupon->code,
            'discount_type'   => $coupon->discount_type,
            'discount_value'  => $coupon->discount_value,
            'discount_amount' => $discountAmount,
            'description'     => $coupon->description,
            'message'         => $coupon->discount_type === 'percent'
                ? "Coupon '{$coupon->code}' applied ({$coupon->discount_value}% OFF)"
                : "Coupon '{$coupon->code}' applied (₹" . number_format($coupon->discount_value) . " OFF)",
        ]);
    }
}
