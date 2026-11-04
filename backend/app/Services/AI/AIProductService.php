<?php

namespace App\Services\AI;

use App\Models\Product;

class AIProductService
{
    /**
     * Generate content for a product (either existing or new input).
     */
    public function generateProductContent(array $input): array
    {
        $name = trim($input['name'] ?? 'Luxury Item');
        $category = $input['category'] ?? 'oud';
        $keywords = $input['keywords'] ?? '';
        $existingDescription = $input['description'] ?? '';

        $categoryThemes = [
            'pillows' => ['notes' => 'Cloud-soft down alternative, ergonomic memory support, and cooling silky-smooth percale cover', 'vibe' => 'blissful orthopaedic support, five-star hotel plushness, and restorative deep sleep'],
            'bath' => ['notes' => 'Ultra-absorbent 800 GSM Turkish cotton, plush looped weave, and spa-grade softness', 'vibe' => 'cloud-like softness and five-star luxury bathing experience'],
            'bedding' => ['notes' => '1000-thread count Egyptian cotton, silk-infused borders and cloud-soft touch', 'vibe' => 'five-star serenity and unmatched sleeping comfort'],
        ];

        $theme = $categoryThemes[$category] ?? $categoryThemes['pillows'];

        $title = "{$name} — Royal Heritage Edition";
        $subtitle = "Handcrafted with {$theme['vibe']}";
        $shortDescription = "An extraordinary creation combining {$theme['notes']}. Designed exclusively for connoisseurs of authentic luxury.";
        $longDescription = "Immerse yourself in the timeless prestige of {$name}. Masterfully curated by master artisans, each batch is precision-crafted to evoke {$theme['vibe']}. Featuring nuanced accords of {$theme['notes']}, it commands an unforgettable presence that endures effortlessly throughout the day and evening.";

        $features = [
            "Crafted with genuine {$theme['notes']}",
            "Long-lasting performance with exquisite luxury sillage",
            "Artisanal presentation packaging with gold-stamped detailing",
            "100% authentic, cruelty-free and dermatologically evaluated",
        ];

        $seoTitle = "Buy {$name} Online | Luxury {$category} | Hijaz Store";
        $seoDescription = "Shop {$name} at Hijaz. Handcrafted luxury featuring {$theme['notes']}. Enjoy fast courier dispatch and authentic guarantee.";
        $seoKeywords = "{$name}, buy {$category} online, luxury {$name}, hijaz {$category}, arabic attar, premium fragrance";

        return [
            'product_name' => $title,
            'subtitle' => $subtitle,
            'short_description' => $shortDescription,
            'long_description' => $longDescription,
            'features' => $features,
            'seo_title' => $seoTitle,
            'seo_description' => $seoDescription,
            'seo_keywords' => $seoKeywords,
        ];
    }

    /**
     * Explicit Admin Approval: Save AI-generated content to database product.
     */
    public function applyProductContent(int $productId, array $approvedContent): Product
    {
        $product = Product::findOrFail($productId);

        if (!empty($approvedContent['name'])) {
            $product->name = $approvedContent['name'];
        }
        if (!empty($approvedContent['subtitle'])) {
            $product->subtitle = $approvedContent['subtitle'];
        }
        if (!empty($approvedContent['description'])) {
            $product->description = $approvedContent['description'];
        }
        if (!empty($approvedContent['seo_title'])) {
            $product->seo_title = $approvedContent['seo_title'];
        }
        if (!empty($approvedContent['seo_description'])) {
            $product->seo_description = $approvedContent['seo_description'];
        }
        if (!empty($approvedContent['seo_keywords'])) {
            $product->seo_keywords = $approvedContent['seo_keywords'];
        }
        if (!empty($approvedContent['features'])) {
            $product->features = is_array($approvedContent['features'])
                ? implode("\n", $approvedContent['features'])
                : $approvedContent['features'];
        }

        $product->save();
        return $product;
    }
}
