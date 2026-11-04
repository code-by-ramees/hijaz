<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIConversation extends Model
{
    use HasFactory;

    protected $table = 'ai_conversations';

    protected $fillable = [
        'session_id',
        'title',
    ];

    public function messages()
    {
        return $this->hasMany(AIMessage::class, 'conversation_id')->orderBy('created_at', 'asc');
    }
}
