<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
use App\Models\Payment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class BookingSeeder extends Seeder
{
    /**
     * Seed varying booking and payment records across multiple dates, times,
     * courts, and verification statuses.
     */
    public function run(): void
    {
        $facilities = Facility::with('courts')->get();

        if ($facilities->isEmpty()) {
            $this->command->warn('No facilities found to seed bookings for.');

            return;
        }

        // Ensure we have a pool of registered players
        $players = User::where('role', 'PLAYER')->get();
        if ($players->count() < 6) {
            $newPlayers = [
                ['name' => 'Rafael Nadal', 'email' => 'rafa.nadal@example.com'],
                ['name' => 'Carlos Alcaraz', 'email' => 'carlos.alcaraz@example.com'],
                ['name' => 'Stephen Curry', 'email' => 'stephen.curry@example.com'],
                ['name' => 'Marcus Gideon', 'email' => 'marcus.gideon@example.com'],
                ['name' => 'Kevin Sanjaya', 'email' => 'kevin.sanjaya@example.com'],
                ['name' => 'Alex Eala', 'email' => 'alex.eala@example.com'],
                ['name' => 'Jia Morado', 'email' => 'jia.morado@example.com'],
                ['name' => 'Luka Doncic', 'email' => 'luka.doncic@example.com'],
            ];

            foreach ($newPlayers as $p) {
                $user = User::firstOrCreate(
                    ['email' => $p['email']],
                    [
                        'name' => $p['name'],
                        'password' => bcrypt('password'),
                        'role' => 'PLAYER',
                        'email_verified_at' => now(),
                    ]
                );
                $players->push($user);
            }
        }

        $guestNames = [
            'Coach Mike Velasco',
            'Barangay Inter-Color League',
            'Metro Smashers Club',
            'Dr. Ramon Bautista',
            'Ateneo Alumni Team',
            'DLSU Spikers Association',
            'Weekend Padel Warriors',
            'Apex Corporate Cup',
            'Sarah Jenkins',
            'David Tan & Friends',
            'Quezon City Shuttlers',
            'Coach Javi Gomez',
        ];

        $sampleReceipts = [
            'https://res.cloudinary.com/dwnu9lxd7/image/upload/v1790430434/Messenger_creation_9919DFAB-CF09-473B-9082-7D6F66D451C8_unz1yl.jpg',
            'https://res.cloudinary.com/dwnu9lxd7/image/upload/v1790433960/gcashqr_zynbos.jpg',
            'https://res.cloudinary.com/dwnu9lxd7/image/upload/v1790433959/mayaqr_wv3fzq.jpg',
        ];

        // Dates range: Past 5 days, today, and next 7 days
        $today = Carbon::today();
        $dateRange = [];

        // 4 past days
        for ($i = 4; $i >= 1; $i--) {
            $dateRange[] = $today->copy()->subDays($i)->format('Y-m-d');
        }
        // Today
        $dateRange[] = $today->format('Y-m-d');
        // 7 future days
        for ($i = 1; $i <= 7; $i++) {
            $dateRange[] = $today->copy()->addDays($i)->format('Y-m-d');
        }

        // Possible time slots designed to prevent collisions
        $timeSlots = [
            // Morning
            ['start' => '07:00', 'end' => '08:30'],
            ['start' => '08:30', 'end' => '10:00'],
            ['start' => '10:00', 'end' => '11:30'],
            // Afternoon
            ['start' => '13:00', 'end' => '14:30'],
            ['start' => '14:30', 'end' => '16:00'],
            ['start' => '16:00', 'end' => '17:30'],
            // Evening
            ['start' => '18:00', 'end' => '19:30'],
            ['start' => '19:30', 'end' => '21:00'],
            ['start' => '21:00', 'end' => '22:30'],
        ];

        // Track booked intervals: $bookedIntervals[courtId][date] = [ [start, end], ... ]
        $bookedIntervals = [];

        // Load existing bookings into collision tracker
        $existing = Booking::whereIn('status', ['pending', 'confirmed'])->get(['court_id', 'date', 'start_time', 'end_time']);
        foreach ($existing as $ex) {
            $dateKey = Carbon::parse($ex->date)->format('Y-m-d');
            $startMin = $this->timeToMinutes($ex->start_time);
            $endMin = $this->timeToMinutes($ex->end_time);
            $bookedIntervals[$ex->court_id][$dateKey][] = [$startMin, $endMin];
        }

        $createdCount = 0;

        foreach ($facilities as $facility) {
            $courts = $facility->courts()->where('status', '!=', 'NOT_AVAILABLE')->get();

            if ($courts->isEmpty()) {
                continue;
            }

            foreach ($courts as $courtIndex => $court) {
                foreach ($dateRange as $dateStr) {
                    $dateCarbon = Carbon::parse($dateStr);
                    $isPast = $dateCarbon->isPast() && ! $dateCarbon->isToday();
                    $isToday = $dateCarbon->isToday();

                    // Decide number of slots to book on this court on this date (2 to 4 slots)
                    $slotsToAttempt = ($courtIndex % 2 === 0) ? [0, 2, 4, 6] : [1, 3, 5, 7];

                    foreach ($slotsToAttempt as $slotIndex) {
                        if (! isset($timeSlots[$slotIndex])) {
                            continue;
                        }

                        $slot = $timeSlots[$slotIndex];
                        $startMin = $this->timeToMinutes($slot['start']);
                        $endMin = $this->timeToMinutes($slot['end']);

                        // Check collision
                        if ($this->hasCollision($bookedIntervals, $court->id, $dateStr, $startMin, $endMin)) {
                            continue;
                        }

                        // Determine status variation: verified / pending / cancelled
                        $roll = rand(1, 100);
                        if ($isPast) {
                            // Past bookings are mostly confirmed (verified), with few cancelled (rejected)
                            $status = ($roll <= 85) ? 'confirmed' : 'cancelled';
                            $paymentStatus = ($status === 'confirmed') ? 'verified' : 'rejected';
                        } elseif ($isToday) {
                            // Today has a healthy mix of verified confirmed matches and pending holds
                            if ($roll <= 55) {
                                $status = 'confirmed';
                                $paymentStatus = 'verified';
                            } elseif ($roll <= 88) {
                                $status = 'pending';
                                $paymentStatus = 'pending';
                            } else {
                                $status = 'cancelled';
                                $paymentStatus = 'rejected';
                            }
                        } else {
                            // Future has active confirmed bookings and incoming pending holds
                            if ($roll <= 50) {
                                $status = 'confirmed';
                                $paymentStatus = 'verified';
                            } elseif ($roll <= 85) {
                                $status = 'pending';
                                $paymentStatus = 'pending';
                            } else {
                                $status = 'cancelled';
                                $paymentStatus = 'rejected';
                            }
                        }

                        // Calculate realistic price
                        $calc = $court->calculatePriceForRange($slot['start'], $slot['end']);
                        $totalPrice = $calc['total'] > 0 ? $calc['total'] : (($court->hourly_rate ?? 300) * 1.5);

                        // User vs Guest player
                        $isRegistered = ($roll % 3 !== 0) && $players->isNotEmpty();
                        $playerUser = $isRegistered ? $players->random() : null;
                        $guestName = $isRegistered ? null : $guestNames[array_rand($guestNames)];

                        // Payment method
                        $methods = ['gcash', 'maya', 'gcash', 'cash', 'bank_transfer'];
                        $method = $methods[array_rand($methods)];
                        $refNumber = match ($method) {
                            'gcash' => 'GCASH-'.date('ymd', strtotime($dateStr)).'-'.rand(100000, 999999),
                            'maya' => 'MAYA-'.date('ymd', strtotime($dateStr)).'-'.rand(100000, 999999),
                            'bank_transfer' => 'BDO-REF-'.rand(1000000, 9999999),
                            default => 'CASH-RCPT-'.rand(10000, 99999),
                        };

                        $proofUrl = ($method === 'cash')
                            ? null
                            : $sampleReceipts[array_rand($sampleReceipts)];

                        $booking = Booking::create([
                            'facility_id' => $facility->id,
                            'court_id' => $court->id,
                            'user_id' => $playerUser?->id,
                            'guest_name' => $guestName,
                            'date' => $dateStr,
                            'start_time' => $slot['start'].':00',
                            'end_time' => $slot['end'].':00',
                            'total_price' => $totalPrice,
                            'status' => $status,
                        ]);

                        Payment::create([
                            'booking_id' => $booking->id,
                            'user_id' => $playerUser?->id,
                            'amount' => $totalPrice,
                            'payment_method' => $method,
                            'proof_path' => $proofUrl,
                            'status' => $paymentStatus,
                            'reference_number' => $refNumber,
                        ]);

                        // Record in collision tracker if not cancelled
                        if ($status !== 'cancelled') {
                            $bookedIntervals[$court->id][$dateStr][] = [$startMin, $endMin];
                        }

                        $createdCount++;
                    }
                }
            }
        }

        $this->command->info("Successfully seeded {$createdCount} varying booking and payment records across multiple dates and times.");
    }

    /**
     * Check if a time interval collides with existing intervals.
     */
    private function hasCollision(array $bookedIntervals, int $courtId, string $date, int $startMin, int $endMin): bool
    {
        if (! isset($bookedIntervals[$courtId][$date])) {
            return false;
        }

        foreach ($bookedIntervals[$courtId][$date] as [$existingStart, $existingEnd]) {
            // Overlap condition: start < existingEnd AND end > existingStart
            if ($startMin < $existingEnd && $endMin > $existingStart) {
                return true;
            }
        }

        return false;
    }

    /**
     * Convert "HH:MM" or "HH:MM:SS" to minutes from midnight.
     */
    private function timeToMinutes(string $timeStr): int
    {
        $parts = explode(':', $timeStr);

        return ((int) $parts[0]) * 60 + ((int) ($parts[1] ?? 0));
    }
}
