<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AI Assistant Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Admin AI System. Supports Gemini, OpenAI, or
    | built-in high-precision deterministic e-commerce analytical engine.
    |
    */

    'provider' => env('AI_PROVIDER', 'gemini'), // 'gemini', 'openai', 'internal'

    'api_key' => env('AI_API_KEY', env('GEMINI_API_KEY', '')),

    'model' => env('AI_MODEL', 'gemini-1.5-flash'),

    'temperature' => (float) env('AI_TEMPERATURE', 0.2), // Low temp for numerical precision

    'max_tokens' => (int) env('AI_MAX_TOKENS', 1500),

    'timeout' => (int) env('AI_TIMEOUT', 20), // in seconds
];
