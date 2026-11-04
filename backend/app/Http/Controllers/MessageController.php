<?php

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    // GET /api/messages — list all (latest first), with optional status filter
    public function index(Request $request)
    {
        $query = Message::latest();

        if ($request->has('status') && $request->status !== 'ALL') {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    // POST /api/messages — store a new message from contact form
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => 'required|email|max:255',
            'subject' => 'nullable|string|max:255',
            'message' => 'required|string',
        ]);

        $msg = Message::create(array_merge($validated, ['status' => 'unread']));

        return response()->json($msg, 201);
    }

    // PATCH /api/messages/{id}/status — update read/replied status
    public function updateStatus(Request $request, $id)
    {
        $msg = Message::findOrFail($id);
        $request->validate(['status' => 'required|in:unread,read,replied']);
        $msg->update(['status' => $request->status]);
        return response()->json($msg);
    }

    // DELETE /api/messages/{id} — delete a message
    public function destroy($id)
    {
        $msg = Message::findOrFail($id);
        $msg->delete();
        return response()->json(['deleted' => true]);
    }
}
