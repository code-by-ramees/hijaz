<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AIConversation;
use App\Services\AI\AIAnalyticsService;
use App\Services\AI\AIChatService;
use App\Services\AI\AIInventoryService;
use App\Services\AI\AIProductService;
use App\Services\AI\AIReviewService;
use App\Services\AI\AISalesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIController extends Controller
{
    protected AIChatService $chatService;
    protected AIAnalyticsService $analyticsService;
    protected AISalesService $salesService;
    protected AIInventoryService $inventoryService;
    protected AIReviewService $reviewService;
    protected AIProductService $productService;

    public function __construct(
        AIChatService $chatService,
        AIAnalyticsService $analyticsService,
        AISalesService $salesService,
        AIInventoryService $inventoryService,
        AIReviewService $reviewService,
        AIProductService $productService
    ) {
        $this->chatService = $chatService;
        $this->analyticsService = $analyticsService;
        $this->salesService = $salesService;
        $this->inventoryService = $inventoryService;
        $this->reviewService = $reviewService;
        $this->productService = $productService;
    }

    /**
     * POST /api/admin/ai/chat
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'conversation_id' => 'nullable|integer',
        ]);

        $result = $this->chatService->handleChatMessage(
            $request->input('message'),
            $request->input('conversation_id')
        );

        return response()->json($result);
    }

    /**
     * GET /api/admin/ai/conversations
     */
    public function getConversations(): JsonResponse
    {
        $conversations = AIConversation::with(['messages' => function ($q) {
            $q->latest()->limit(1);
        }])->latest()->take(15)->get();

        return response()->json($conversations);
    }

    /**
     * GET /api/admin/ai/conversations/{id}
     */
    public function getConversation(int $id): JsonResponse
    {
        $conversation = AIConversation::with('messages')->findOrFail($id);
        return response()->json($conversation);
    }

    /**
     * DELETE /api/admin/ai/conversations/{id}
     */
    public function deleteConversation(int $id): JsonResponse
    {
        $conversation = AIConversation::findOrFail($id);
        $conversation->delete();
        return response()->json(['success' => true]);
    }

    /**
     * GET /api/admin/ai/insights/overview
     */
    public function getInsightsOverview(): JsonResponse
    {
        $insights = $this->analyticsService->generateAutomatedInsights();
        return response()->json($insights);
    }

    /**
     * GET /api/admin/ai/insights/sales
     */
    public function getSalesInsights(): JsonResponse
    {
        $sales = $this->salesService->getSalesSummary();
        $categories = $this->salesService->getCategorySales();
        $topProducts = $this->salesService->getTopSellingProducts(10);
        $customers = $this->salesService->getCustomerStatistics();

        return response()->json([
            'sales_summary' => $sales,
            'category_breakdown' => $categories,
            'top_products' => $topProducts,
            'customer_stats' => $customers,
        ]);
    }

    /**
     * GET /api/admin/ai/insights/inventory
     */
    public function getInventoryInsights(): JsonResponse
    {
        $health = $this->inventoryService->getInventoryHealthSummary();
        return response()->json($health);
    }

    /**
     * GET /api/admin/ai/insights/reviews
     */
    public function getReviewInsights(): JsonResponse
    {
        $reviews = $this->reviewService->getAllReviewsAnalytics();
        return response()->json($reviews);
    }

    /**
     * POST /api/admin/ai/generate/product
     */
    public function generateProductContent(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|in:pillows,bath,bedding',
            'keywords' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $content = $this->productService->generateProductContent($request->all());
        return response()->json($content);
    }

    /**
     * POST /api/admin/ai/apply/product (Explicit Admin Approval)
     */
    public function applyProductContent(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'name' => 'nullable|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'seo_title' => 'nullable|string',
            'seo_description' => 'nullable|string',
            'seo_keywords' => 'nullable|string',
            'features' => 'nullable',
        ]);

        $product = $this->productService->applyProductContent(
            (int) $request->input('product_id'),
            $request->all()
        );

        return response()->json([
            'success' => true,
            'message' => "Content approved and updated for {$product->name}",
            'product' => $product,
        ]);
    }
}
