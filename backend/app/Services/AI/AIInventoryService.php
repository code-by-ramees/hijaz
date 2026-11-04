<?php

namespace App\Services\AI;

use App\Models\Product;

class AIInventoryService
{
    /**
     * Get products where stock is below threshold.
     */
    public function getLowStockProducts(): array
    {
        return Product::where('stock', '>', 0)
            ->whereColumn('stock', '<=', 'low_stock_threshold')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'category' => $p->category,
                'current_stock' => (int) $p->stock,
                'threshold' => (int) $p->low_stock_threshold,
                'price' => (float) $p->price,
                'status' => 'LOW_STOCK',
                'recommended_reorder_qty' => max(25 - (int) $p->stock, 15),
            ])
            ->toArray();
    }

    /**
     * Get out of stock products.
     */
    public function getOutOfStockProducts(): array
    {
        return Product::where('stock', '<=', 0)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'category' => $p->category,
                'current_stock' => 0,
                'price' => (float) $p->price,
                'status' => 'OUT_OF_STOCK',
                'recommended_reorder_qty' => 30,
            ])
            ->toArray();
    }

    /**
     * Get overall inventory health summary.
     */
    public function getInventoryHealthSummary(): array
    {
        $allProducts = Product::all();
        $totalProducts = $allProducts->count();
        $totalUnits = $allProducts->sum('stock');
        $outOfStock = $allProducts->where('stock', '<=', 0)->count();
        $lowStock = $allProducts->filter(fn ($p) => $p->stock > 0 && $p->stock <= $p->low_stock_threshold)->count();
        $healthyStock = $totalProducts - ($outOfStock + $lowStock);

        $inventoryValuation = $allProducts->reduce(function ($carry, $p) {
            return $carry + ($p->price * max($p->stock, 0));
        }, 0.0);

        return [
            'total_skus' => $totalProducts,
            'total_inventory_units' => $totalUnits,
            'inventory_valuation' => round($inventoryValuation, 2),
            'healthy_skus' => $healthyStock,
            'low_stock_skus' => $lowStock,
            'out_of_stock_skus' => $outOfStock,
            'critical_items' => array_merge($this->getOutOfStockProducts(), $this->getLowStockProducts()),
        ];
    }
}
