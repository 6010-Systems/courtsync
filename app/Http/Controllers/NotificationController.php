<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->notifications()
            ->limit(20)
            ->get()
            ->map(fn (DatabaseNotification $notification): array => $this->present($notification))
            ->values();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markAsRead(Request $request, string $notification): JsonResponse
    {
        $record = $request->user()->notifications()->findOrFail($notification);
        $record->markAsRead();

        return response()->json([
            'read_at' => $record->read_at?->toISOString(),
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $readAt = now();
        $request->user()->unreadNotifications()->reorder()->update(['read_at' => $readAt]);

        return response()->json([
            'read_at' => $readAt->toISOString(),
            'unread_count' => 0,
        ]);
    }

    /**
     * @return array{id: string, title: string, message: string, url: string|null, read_at: string|null, created_at: string|null}
     */
    private function present(DatabaseNotification $notification): array
    {
        $data = $notification->data;

        return [
            'id' => $notification->id,
            'title' => is_string($data['title'] ?? null) ? $data['title'] : 'Notification',
            'message' => is_string($data['message'] ?? null) ? $data['message'] : '',
            'url' => is_string($data['url'] ?? null) ? $data['url'] : null,
            'read_at' => $notification->read_at?->toISOString(),
            'created_at' => $notification->created_at?->toISOString(),
        ];
    }
}
