<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class BookingRequested extends Notification implements ShouldQueueAfterCommit
{
    use Queueable;

    public function __construct(public Booking $booking) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database', WebPushChannel::class];
    }

    /** @return array{booking_id: int, title: string, message: string, url: string} */
    public function toDatabase(object $notifiable): array
    {
        $details = $this->details();

        return [
            'booking_id' => $this->booking->id,
            'title' => $details['title'],
            'message' => $details['message'],
            'url' => $details['url'],
        ];
    }

    /** Get the payload delivered to the subscribed browser. */
    public function toWebPush(object $notifiable, Notification $notification): WebPushMessage
    {
        $details = $this->details();

        return (new WebPushMessage)
            ->title($details['title'])
            ->body($details['message'])
            ->icon('/assets/ball.png')
            ->tag('booking-requested-'.$this->booking->id)
            ->renotify()
            ->requireInteraction()
            ->data(['url' => $details['url']])
            ->options(['TTL' => 3600, 'urgency' => 'high']);
    }

    /** @return array{title: string, message: string, url: string} */
    private function details(): array
    {
        $this->booking->loadMissing(['court', 'facility']);
        $date = Carbon::parse($this->booking->date)->format('l, F j, Y');
        $start = Carbon::parse($this->booking->start_time)->format('g:i A');
        $end = Carbon::parse($this->booking->end_time)->format('g:i A');
        $venue = $this->booking->facility->name;
        $court = $this->booking->court->name;

        return [
            'title' => 'New booking request',
            'message' => "Booking #{$this->booking->id} on {$date} from {$start} to {$end} at {$venue} on {$court} awaits confirmation.",
            'url' => route('facility.bookings'),
        ];
    }
}
