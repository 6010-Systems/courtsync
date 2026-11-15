<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class BookingConfirmed extends Notification implements ShouldQueueAfterCommit
{
    use Queueable;

    public function __construct(public Booking $booking) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', WebPushChannel::class];
    }

    /**
     * Get the data stored for the player's notification list.
     *
     * @return array{booking_id: int, title: string, message: string, url: string}
     */
    public function toDatabase(object $notifiable): array
    {
        $details = $this->details();

        return [
            'booking_id' => $this->booking->id,
            'title' => $details['title'],
            'message' => $details['message'],
            'url' => $details['path'],
        ];
    }

    /**
     * Get the payload delivered to the player's subscribed browsers.
     */
    public function toWebPush(object $notifiable, Notification $notification): WebPushMessage
    {
        $details = $this->details();

        return (new WebPushMessage)
            ->title($details['title'])
            ->body($details['message'])
            ->icon('/assets/ball.png')
            ->tag('booking-'.$this->booking->id)
            ->renotify()
            ->requireInteraction()
            ->data(['url' => $details['url']])
            ->options(['TTL' => 3600, 'urgency' => 'high']);
    }

    /**
     * @return array{title: string, message: string, path: string, url: string}
     */
    private function details(): array
    {
        $this->booking->loadMissing(['court', 'facility']);
        $date = Carbon::parse($this->booking->date)->format('l, F j, Y');
        $start = Carbon::parse($this->booking->start_time)->format('g:i A');
        $end = Carbon::parse($this->booking->end_time)->format('g:i A');
        $venue = $this->booking->facility->name;
        $court = $this->booking->court->name;

        return [
            'title' => 'Booking confirmed',
            'message' => "Your booking #{$this->booking->id} on {$date} from {$start} to {$end} at {$venue} on {$court} has been confirmed.",
            'path' => route('player.bookings', [], false),
            'url' => route('player.bookings'),
        ];
    }
}
