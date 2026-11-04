<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Razorpay\Api\Api;
use Razorpay\Api\Errors\SignatureVerificationError;

class PaymentController extends Controller
{
    /**
     * Get the Razorpay API instance.
     */
    protected function getRazorpayApi(): Api
    {
        $keyId = config('services.razorpay.key') ?? env('RAZORPAY_KEY_ID');
        $keySecret = config('services.razorpay.secret') ?? env('RAZORPAY_KEY_SECRET');

        if (empty($keyId) || empty($keySecret)) {
            throw new \Exception('Razorpay credentials are not configured in backend/.env.');
        }

        return new Api($keyId, $keySecret);
    }

    /**
     * Fetch public Razorpay Key for client initialization.
     */
    public function getKey()
    {
        $keyId = config('services.razorpay.key') ?? env('RAZORPAY_KEY_ID');

        return response()->json([
            'key' => $keyId,
        ]);
    }

    /**
     * Create Razorpay Order and initialize/persist the system order.
     */
    public function createOrder(Request $request)
    {
        $request->validate([
            'order_number'    => 'required|string',
            'user_uid'        => 'nullable|string',
            'customer_name'   => 'required|string',
            'customer_email'  => 'nullable|string',
            'customer_phone'  => 'nullable|string',
            'shipping_address'=> 'required|string',
            'address_type'    => 'nullable|string',
            'total_amount'    => 'required|numeric|min:1',
            'items'           => 'required|array',
            'subtotal'        => 'nullable|numeric',
            'discount'        => 'nullable|numeric',
            'shipping_fee'    => 'nullable|numeric',
            'coupon_code'     => 'nullable|string',
            'simulate'        => 'nullable|boolean',
        ]);

        try {
            // 1. Create or update the pending Order in our database
            $order = Order::updateOrCreate(
                ['order_number' => $request->order_number],
                [
                    'user_uid'         => $request->user_uid,
                    'customer_name'    => $request->customer_name,
                    'customer_email'   => $request->customer_email,
                    'customer_phone'   => $request->customer_phone,
                    'shipping_address' => $request->shipping_address,
                    'address_type'     => $request->address_type ?? 'Home',
                    'payment_method'   => 'razorpay',
                    'payment_status'   => 'pending',
                    'status'           => 'Processing',
                    'subtotal'         => $request->subtotal ?? $request->total_amount,
                    'discount'         => $request->discount ?? 0,
                    'shipping_fee'     => $request->shipping_fee ?? 0,
                    'total_amount'     => $request->total_amount,
                    'items'            => $request->items,
                ]
            );

            $amountInPaise = (int) round($order->total_amount * 100);

            // Simulation mode for local sandbox testing without live Razorpay keys
            if ($request->boolean('simulate') && app()->isLocal()) {
                $simOrderId = 'order_sim_' . uniqid();
                Payment::updateOrCreate(
                    ['order_id' => $order->id],
                    [
                        'razorpay_order_id' => $simOrderId,
                        'amount'            => $amountInPaise,
                        'status'            => 'created',
                    ]
                );

                return response()->json([
                    'success'           => true,
                    'simulated'         => true,
                    'razorpay_order_id' => $simOrderId,
                    'amount'            => $amountInPaise,
                    'currency'          => 'INR',
                    'razorpay_key'      => 'rzp_test_simulated',
                    'order'             => $order,
                ]);
            }

            // 2. Initialize Razorpay API
            $api = $this->getRazorpayApi();
            $keyId = config('services.razorpay.key') ?? env('RAZORPAY_KEY_ID');

            // 3. Create Order on Razorpay
            $razorpayOrder = $api->order->create([
                'receipt'  => substr((string) $order->order_number, 0, 40),
                'amount'   => $amountInPaise,
                'currency' => 'INR',
                'notes'    => [
                    'order_id'       => (string) $order->id,
                    'order_number'   => (string) $order->order_number,
                    'customer_name'  => (string) $order->customer_name,
                    'customer_email' => (string) $order->customer_email,
                ],
            ]);

            // 4. Save Payment record locally
            Payment::updateOrCreate(
                ['order_id' => $order->id],
                [
                    'razorpay_order_id' => $razorpayOrder['id'],
                    'amount'            => $amountInPaise,
                    'status'            => 'created',
                ]
            );

            return response()->json([
                'success'           => true,
                'razorpay_order_id' => $razorpayOrder['id'],
                'amount'            => $razorpayOrder['amount'],
                'currency'          => $razorpayOrder['currency'],
                'razorpay_key'      => $keyId,
                'order'             => $order,
            ]);
        } catch (\Exception $e) {
            Log::error('Razorpay Order Creation Failed: ' . $e->getMessage());

            $isAuthError = str_contains(strtolower($e->getMessage()), 'auth') || str_contains(strtolower($e->getMessage()), 'key');

            return response()->json([
                'success' => false,
                'is_auth_error' => $isAuthError,
                'message' => $isAuthError
                    ? 'Razorpay Authentication Failed: The API Key ID or Secret in backend/.env is invalid or inactive. Please update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env with your Razorpay Dashboard test keys.'
                    : 'Failed to initialize Razorpay payment: ' . $e->getMessage(),
                'order' => $order ?? null,
            ], 400);
        }
    }

    /**
     * Verify payment signature from Razorpay checkout.
     */
    public function verifyPayment(Request $request)
    {
        $validated = $request->validate([
            'razorpay_order_id'   => 'required|string',
            'razorpay_payment_id' => 'required|string',
            'razorpay_signature'  => 'required|string',
            'order_number'        => 'nullable|string',
            'coupon_code'         => 'nullable|string',
        ]);

        try {
            // Handle local developer sandbox simulation
            if (str_starts_with($validated['razorpay_payment_id'], 'sim_pay_') && app()->isLocal()) {
                $payment = Payment::where('razorpay_order_id', $validated['razorpay_order_id'])->first();

                if ($payment) {
                    $payment->update([
                        'razorpay_payment_id' => $validated['razorpay_payment_id'],
                        'razorpay_signature'  => $validated['razorpay_signature'],
                        'status'              => 'paid',
                    ]);
                    $order = $payment->order;
                } else {
                    $order = Order::where('order_number', $validated['order_number'])->first();
                }

                if ($order) {
                    $order->update([
                        'payment_status' => 'paid',
                        'payment_method' => 'razorpay',
                        'status'         => 'Processing',
                    ]);
                }

                if (!empty($validated['coupon_code'])) {
                    \App\Models\Coupon::where('code', strtoupper(trim($validated['coupon_code'])))->increment('used_count');
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Simulated payment verified successfully (Local Dev Sandbox).',
                    'order'   => $order,
                ]);
            }

            $api = $this->getRazorpayApi();

            // Verify Razorpay HMAC signature
            $api->utility->verifyPaymentSignature([
                'razorpay_order_id'   => $validated['razorpay_order_id'],
                'razorpay_payment_id' => $validated['razorpay_payment_id'],
                'razorpay_signature'  => $validated['razorpay_signature'],
            ]);

            // Signature is valid!
            $payment = Payment::where('razorpay_order_id', $validated['razorpay_order_id'])->first();

            if ($payment) {
                $payment->update([
                    'razorpay_payment_id' => $validated['razorpay_payment_id'],
                    'razorpay_signature'  => $validated['razorpay_signature'],
                    'status'              => 'paid',
                ]);

                $order = $payment->order;
            } else {
                $order = Order::where('order_number', $validated['order_number'] ?? '')->first();
            }

            if ($order) {
                $order->update([
                    'payment_status' => 'paid',
                    'payment_method' => 'razorpay',
                    'status'         => 'Processing',
                ]);
            }

            if (!empty($validated['coupon_code'])) {
                \App\Models\Coupon::where('code', strtoupper(trim($validated['coupon_code'])))->increment('used_count');
            }

            return response()->json([
                'success' => true,
                'message' => 'Payment verified successfully.',
                'order'   => $order,
            ]);
        } catch (SignatureVerificationError $e) {
            Log::error('Razorpay Signature Verification Error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Payment signature verification failed.',
            ], 400);
        } catch (\Exception $e) {
            Log::error('Razorpay Verification General Error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Payment verification encountered an error: ' . $e->getMessage(),
            ], 500);
        }
    }
}
