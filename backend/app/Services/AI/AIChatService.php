<?php

namespace App\Services\AI;

use App\Models\AIConversation;
use App\Models\AIMessage;

class AIChatService
{
    protected AIService $aiService;
    protected AISalesService $salesService;
    protected AIInventoryService $inventoryService;
    protected AIReviewService $reviewService;

    public function __construct(
        AIService $aiService,
        AISalesService $salesService,
        AIInventoryService $inventoryService,
        AIReviewService $reviewService
    ) {
        $this->aiService = $aiService;
        $this->salesService = $salesService;
        $this->inventoryService = $inventoryService;
        $this->reviewService = $reviewService;
    }

    /**
     * Handle an admin message within a conversation.
     */
    public function handleChatMessage(string $message, ?int $conversationId = null, string $sessionId = 'admin-default'): array
    {
        // 1. Get or create conversation
        if ($conversationId) {
            $conversation = AIConversation::find($conversationId);
        }

        if (empty($conversation)) {
            $conversation = AIConversation::create([
                'session_id' => $sessionId,
                'title' => substr($message, 0, 45) . (strlen($message) > 45 ? '...' : ''),
            ]);
        }

        // 2. Persist user message
        AIMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $message,
        ]);

        // 3. Assemble verified real-time database context
        $contextData = [
            'sales' => $this->salesService->getSalesSummary(),
            'top_products' => $this->salesService->getTopSellingProducts(10),
            'slow_moving_products' => $this->salesService->getSlowMovingProducts(10),
            'categories' => $this->salesService->getCategorySales(),
            'inventory' => $this->inventoryService->getInventoryHealthSummary(),
            'reviews' => $this->reviewService->getAllReviewsAnalytics(),
            'customers' => $this->salesService->getCustomerStatistics(),
        ];

        // 4. Build system prompt
        $systemPrompt = "You are the Executive AI Store Intelligence Assistant for Hijaz Luxury Store Administrators.\n" .
            "Your role is to provide deep, actionable, and precise commercial insights on sales, inventory, product velocity, and customer sentiment.\n" .
            "RULES:\n" .
            "1. ONLY use verified numerical facts from the provided database metrics. NEVER invent numbers.\n" .
            "2. Format responses with clean Markdown headers, bullet points, and bold figures for high readability.\n" .
            "3. Offer strategic recommendations where relevant (e.g. restock suggestions, promotional bundles).";

        // 5. Generate AI response
        $replyContent = $this->aiService->generateResponse($systemPrompt, $message, $contextData);

        // 6. Persist assistant message
        $aiMessageRecord = AIMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $replyContent,
            'metadata' => [
                'timestamp' => now()->toISOString(),
            ],
        ]);

        return [
            'conversation_id' => $conversation->id,
            'message' => [
                'id' => $aiMessageRecord->id,
                'role' => 'assistant',
                'content' => $replyContent,
                'created_at' => $aiMessageRecord->created_at->format('h:i A'),
            ],
        ];
    }
}
