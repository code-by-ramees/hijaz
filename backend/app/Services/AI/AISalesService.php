<?php

namespace App\Services\AI;

use App\Models\Order;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AISalesService
{
    /**
     * Get complete sales summary for different time horizons.
     */
    public function getSalesSummary(): array
    {
        $now = Carbon::now();
        $todayStart = $now->copy()->startOfDay();
        $yesterdayStart = $now->copy()->subDay()->startOfDay();
        $yesterdayEnd = $now->copy()->subDay()->endOfDay();
        $thisMonthStart = $now->copy()->startOfMonth();
        $lastMonthStart = $now->copy()->subMonth()->startOfMonth();
        $lastMonthEnd = $now->copy()->subMonth()->endOfMonth();

        // Valid paid/processing/shipped/delivered orders (exclude cancelled)
        $baseQuery = Order::where('status', '!=', 'Cancelled');

        $totalRevenue = (float) (clone $baseQuery)->sum('total_amount');
        $totalOrders = (clone $baseQuery)->count();
        $avgOrderValue = $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0;

        // Today
        $todayQuery = (clone $baseQuery)->where('created_at', '>=', $todayStart);
        $todayRevenue = (float) (clone $todayQuery)->sum('total_amount');
        $todayOrders = (clone $todayQuery)->count();

        // Yesterday
        $yesterdayQuery = (clone $baseQuery)->whereBetween('created_at', [$yesterdayStart, $yesterdayEnd]);
        $yesterdayRevenue = (float) (clone $yesterdayQuery)->sum('total_amount');
        $yesterdayOrders = (clone $yesterdayQuery)->count();

        // This Month
        $thisMonthQuery = (clone $baseQuery)->where('created_at', '>=', $thisMonthStart);
        $thisMonthRevenue = (float) (clone $thisMonthQuery)->sum('total_amount');
        $thisMonthOrders = (clone $thisMonthQuery)->count();

        // Last Month
        $lastMonthQuery = (clone $baseQuery)->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd]);
        $lastMonthRevenue = (float) (clone $lastMonthQuery)->sum('total_amount');
        $lastMonthOrders = (clone $lastMonthQuery)->count();

        // Month-over-Month Growth
        $momRevenueGrowth = $lastMonthRevenue > 0
            ? round((($thisMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1)
            : ($thisMonthRevenue > 0 ? 100.0 : 0.0);

        return [
            'total_revenue' => $totalRevenue,
            'total_orders' => $totalOrders,
            'average_order_value' => $avgOrderValue,
            'today' => [
                'revenue' => $todayRevenue,
                'orders' => $todayOrders,
            ],
            'yesterday' => [
                'revenue' => $yesterdayRevenue,
                'orders' => $yesterdayOrders,
            ],
            'this_month' => [
                'revenue' => $thisMonthRevenue,
                'orders' => $thisMonthOrders,
            ],
            'last_month' => [
                'revenue' => $lastMonthRevenue,
                'orders' => $lastMonthOrders,
            ],
            'mom_growth_percentage' => $momRevenueGrowth,
        ];
    }

    /**
     * Get top-selling products calculated from actual order line items.
     */
    public function getTopSellingProducts(int $limit = 5): array
    {
        $orders = Order::where('status', '!=', 'Cancelled')->get();
        $productStats = [];

        foreach ($orders as $order) {
            $items = is_array($order->items) ? $order->items : json_decode($order->items, true) ?? [];
            foreach ($items as $item) {
                $name = $item['name'] ?? 'Unknown Item';
                $price = (float) ($item['price'] ?? 0);
                $qty = (int) ($item['quantity'] ?? 1);
                $lineTotal = $price * $qty;

                if (!isset($productStats[$name])) {
                    $productStats[$name] = [
                        'name' => $name,
                        'total_quantity_sold' => 0,
                        'total_revenue' => 0.0,
                        'order_occurrences' => 0,
                    ];
                }

                $productStats[$name]['total_quantity_sold'] += $qty;
                $productStats[$name]['total_revenue'] += $lineTotal;
                $productStats[$name]['order_occurrences'] += 1;
            }
        }

        // If no orders yet, populate top products by rating/catalog
        if (empty($productStats)) {
            $topCatalog = Product::orderBy('rating', 'desc')->take($limit)->get();
            return $topCatalog->map(fn ($p) => [
                'name' => $p->name,
                'total_quantity_sold' => 0,
                'total_revenue' => 0.0,
                'order_occurrences' => 0,
                'current_stock' => $p->stock,
                'price' => $p->price,
            ])->toArray();
        }

        usort($productStats, fn ($a, $b) => $b['total_quantity_sold'] <=> $a['total_quantity_sold']);

        return array_slice($productStats, 0, $limit);
    }

    /**
     * Get products with zero or lowest sales.
     */
    public function getSlowMovingProducts(int $limit = 5): array
    {
        $topSold = collect($this->getTopSellingProducts(100))->pluck('name')->toArray();
        $allProducts = Product::all();

        $slowMoving = [];
        foreach ($allProducts as $prod) {
            if (!in_array($prod->name, $topSold)) {
                $slowMoving[] = [
                    'name' => $prod->name,
                    'category' => $prod->category,
                    'price' => $prod->price,
                    'stock' => $prod->stock,
                    'total_quantity_sold' => 0,
                ];
            }
        }

        return array_slice($slowMoving, 0, $limit);
    }

    /**
     * Get revenue breakdown across product categories.
     */
    public function getCategorySales(): array
    {
        $categories = [
            'pillows' => ['label' => 'Luxury Pillows', 'revenue' => 0.0, 'items_sold' => 0],
            'bath' => ['label' => 'Bath & Towels Collection', 'revenue' => 0.0, 'items_sold' => 0],
            'bedding' => ['label' => 'Bedding & Sleep', 'revenue' => 0.0, 'items_sold' => 0],
        ];

        $productCategoryMap = Product::pluck('category', 'name')->toArray();

        $orders = Order::where('status', '!=', 'Cancelled')->get();
        foreach ($orders as $order) {
            $items = is_array($order->items) ? $order->items : json_decode($order->items, true) ?? [];
            foreach ($items as $item) {
                $name = $item['name'] ?? '';
                $price = (float) ($item['price'] ?? 0);
                $qty = (int) ($item['quantity'] ?? 1);
                $category = $productCategoryMap[$name] ?? 'oud';

                if (isset($categories[$category])) {
                    $categories[$category]['revenue'] += ($price * $qty);
                    $categories[$category]['items_sold'] += $qty;
                }
            }
        }

        return $categories;
    }

    /**
     * Get customer statistics without exposing any PII or credentials.
     */
    public function getCustomerStatistics(): array
    {
        $orders = Order::where('status', '!=', 'Cancelled')->get();

        $customerOrderCounts = [];
        foreach ($orders as $order) {
            $key = $order->user_uid ?: ($order->customer_email ?: $order->customer_name);
            if ($key) {
                $customerOrderCounts[$key] = ($customerOrderCounts[$key] ?? 0) + 1;
            }
        }

        $totalUniqueCustomers = count($customerOrderCounts);
        $repeatCustomers = collect($customerOrderCounts)->filter(fn ($count) => $count > 1)->count();
        $repeatRate = $totalUniqueCustomers > 0
            ? round(($repeatCustomers / $totalUniqueCustomers) * 100, 1)
            : 0.0;

        return [
            'total_unique_customers' => $totalUniqueCustomers,
            'repeat_customers' => $repeatCustomers,
            'repeat_purchase_rate_percentage' => $repeatRate,
            'total_registered_users' => DB::table('users')->count(),
        ];
    }
}
