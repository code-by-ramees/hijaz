<?php

namespace App\Services\AI;

class AIAnalyticsService
{
    protected AISalesService $salesService;
    protected AIInventoryService $inventoryService;
    protected AIReviewService $reviewService;

    public function __construct(
        AISalesService $salesService,
        AIInventoryService $inventoryService,
        AIReviewService $reviewService
    ) {
        $this->salesService = $salesService;
        $this->inventoryService = $inventoryService;
        $this->reviewService = $reviewService;
    }

    /**
     * Generate automated strategic business insights.
     */
    public function generateAutomatedInsights(): array
    {
        $sales = $this->salesService->getSalesSummary();
        $inventory = $this->inventoryService->getInventoryHealthSummary();
        $topProducts = $this->salesService->getTopSellingProducts(3);
        $categories = $this->salesService->getCategorySales();
        $reviews = $this->reviewService->getAllReviewsAnalytics();

        $insights = [];

        // 1. Sales Performance Trend
        $momGrowth = $sales['mom_growth_percentage'];
        if ($momGrowth > 0) {
            $insights[] = [
                'type' => 'growth',
                'severity' => 'positive',
                'title' => "Revenue Growth (+{$momGrowth}% MoM)",
                'description' => "Monthly revenue is up {$momGrowth}%. Top performing category is leading customer acquisition.",
                'metric' => "₹" . number_format($sales['this_month']['revenue']),
            ];
        } else {
            $insights[] = [
                'type' => 'sales',
                'severity' => 'neutral',
                'title' => "Store Performance Overview",
                'description' => "Total lifetime revenue stands at ₹" . number_format($sales['total_revenue']) . " across " . $sales['total_orders'] . " completed orders.",
                'metric' => "₹" . number_format($sales['total_revenue']),
            ];
        }

        // 2. Inventory Alert Insight
        if ($inventory['low_stock_skus'] > 0 || $inventory['out_of_stock_skus'] > 0) {
            $criticalCount = $inventory['low_stock_skus'] + $inventory['out_of_stock_skus'];
            $insights[] = [
                'type' => 'inventory',
                'severity' => 'warning',
                'title' => "{$criticalCount} Products Require Restocking",
                'description' => "{$inventory['low_stock_skus']} items are below threshold and {$inventory['out_of_stock_skus']} are out of stock. Immediate replenishment recommended.",
                'metric' => "{$criticalCount} SKUs",
            ];
        } else {
            $insights[] = [
                'type' => 'inventory',
                'severity' => 'positive',
                'title' => "Optimal Inventory Health",
                'description' => "All {$inventory['total_skus']} SKUs are well-stocked above low-stock thresholds.",
                'metric' => "{$inventory['total_inventory_units']} Units",
            ];
        }

        // 3. Top Promotional Opportunity
        if (!empty($topProducts)) {
            $top = $topProducts[0];
            $insights[] = [
                'type' => 'opportunity',
                'severity' => 'info',
                'title' => "Promotional Opportunity: {$top['name']}",
                'description' => "Best-performing product with highest demand. Consider featuring on the homepage banner or pairing in bundle deals.",
                'metric' => "Top Seller",
            ];
        }

        // 4. Customer Feedback / Sentiment Insight
        $satisfaction = $reviews['sentiment_breakdown']['positive_percentage'] ?? 100;
        $insights[] = [
            'type' => 'reviews',
            'severity' => $satisfaction >= 80 ? 'positive' : 'warning',
            'title' => "{$satisfaction}% Customer Satisfaction",
            'description' => "Store rating averages {$reviews['average_store_rating']}/5.0 based on verified customer feedback.",
            'metric' => "{$reviews['average_store_rating']} ★",
        ];

        return [
            'summary_kpis' => [
                'total_revenue' => $sales['total_revenue'],
                'total_orders' => $sales['total_orders'],
                'average_order_value' => $sales['average_order_value'],
                'low_stock_count' => $inventory['low_stock_skus'],
                'out_of_stock_count' => $inventory['out_of_stock_skus'],
                'satisfaction_rate' => $satisfaction,
            ],
            'insights' => $insights,
            'top_products' => $topProducts,
            'category_breakdown' => $categories,
        ];
    }
}
