<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Seeder;

class FacilityOwnerSeeder extends Seeder
{
    /**
     * Seed facility owner accounts, each with an approved facility and a
     * handful of courts.
     *
     * Access: can manage their own facility/facilities (create, edit, verification
     * submission, courts), manage staff and players within those facilities, and
     * control which of those permissions their staff are granted. Cannot access
     * the /admin panel (CheckAdmin blocks anyone whose role isn't 'ADMIN').
     */
    public function run(): void
    {
        $demoOwner = User::factory()
            ->facilityOwner()
            ->create([
                'name' => 'Owner Demo',
                'email' => 'owner@example.com',
            ]);

        // First facility: has a prominent logo and verified photos
        $firstFacility = Facility::factory()
            ->withLogo()
            ->create([
                'user_id' => $demoOwner->id,
                'name' => 'CourtSync Premier Sports Arena',
                'slug' => 'courtsync-premier-arena',
                'logo_url' => 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=300&q=80',
                'cover_photo_url' => 'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=1600&q=80',
                'gcash_name' => 'CourtSync Demo',
                'gcash_number' => '0912 345 6789',
                'gcash_qr_url' => 'https://res.cloudinary.com/dwnu9lxd7/image/upload/v1790433960/gcashqr_zynbos.jpg',
                'maya_name' => 'CourtSync Demo',
                'maya_number' => '0912 345 6789',
                'maya_qr_url' => 'https://res.cloudinary.com/dwnu9lxd7/image/upload/v1790433959/mayaqr_wv3fzq.jpg',
            ]);

        // Second facility: clearly NO logo (logo_url = null) to test the clean no-logo layout
        $secondFacility = Facility::factory()
            ->withoutLogo()
            ->create([
                'user_id' => $demoOwner->id,
                'name' => 'Metro Play Community Complex',
                'slug' => 'metro-play-complex',
                'logo_url' => null,
                'cover_photo_url' => 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1600&q=80',
                'gcash_name' => 'CourtSync Demo',
                'gcash_number' => '0912 345 6789',
                'gcash_qr_url' => 'https://res.cloudinary.com/dwnu9lxd7/image/upload/v1790433960/gcashqr_zynbos.jpg',
                'maya_name' => 'CourtSync Demo',
                'maya_number' => '0912 345 6789',
                'maya_qr_url' => 'https://res.cloudinary.com/dwnu9lxd7/image/upload/v1790433959/mayaqr_wv3fzq.jpg',
            ]);

        collect([$firstFacility, $secondFacility])->each(function (Facility $facility) {
            // Mix of split and flat rate courts for demo testing
            Court::factory()->splitPricing(300, 450, '18:00:00')->create(['facility_id' => $facility->id, 'name' => 'Court 1 (Split Day/Night)']);
            Court::factory()->flatPricing(350)->create(['facility_id' => $facility->id, 'name' => 'Court 2 (Flat Rate)']);
            Court::factory()->openPlay()->splitPricing(250, 400, '17:00:00')->create(['facility_id' => $facility->id, 'name' => 'Court 3 (Open Play)']);
            Court::factory()->blocked()->flatPricing(400)->create(['facility_id' => $facility->id, 'name' => 'Court 4 (Maintenance)']);
        });

        // Create sample bookings and payment for the first facility to test receipt viewing
        $court = $firstFacility->courts()->first();

        for ($i = 0; $i < 10; $i++) {
            $booking = Booking::create([
                'facility_id' => $firstFacility->id,
                'court_id' => $court->id,
                'user_id' => null,
                'guest_name' => 'Demo Player '.($i + 1),
                'date' => now()->addDays($i)->format('Y-m-d'),
                'start_time' => '18:00',
                'end_time' => '20:00',
                'total_price' => 500,
                'status' => 'pending',
            ]);

            Payment::create([
                'booking_id' => $booking->id,
                'amount' => 500,
                'payment_method' => $i % 2 === 0 ? 'gcash' : 'maya',
                'proof_path' => 'https://res.cloudinary.com/dwnu9lxd7/image/upload/v1790430434/Messenger_creation_9919DFAB-CF09-473B-9082-7D6F66D451C8_unz1yl.jpg',
                'status' => 'pending',
            ]);
        }

        // 3 additional facility owners with distinct facilities
        $otherFacilitiesData = [
            [
                'name' => 'Cartwright & Sons Basketball Arena',
                'slug' => 'cartwright-basketball-arena',
                'cover_photo_url' => 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1600&q=80',
                'logo_url' => 'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?auto=format&fit=crop&w=300&q=80',
            ],
            [
                'name' => 'Schumm Group Futsal & Turf Center',
                'slug' => 'schumm-futsal-turf',
                'cover_photo_url' => 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=80',
                'logo_url' => null, // Explicitly no logo
            ],
            [
                'name' => 'Abernathy Badminton & Racket Club',
                'slug' => 'abernathy-badminton-club',
                'cover_photo_url' => 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1600&q=80',
                'logo_url' => 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=300&q=80',
            ],
        ];

        foreach ($otherFacilitiesData as $data) {
            $owner = User::factory()
                ->facilityOwner()
                ->create();

            $facility = Facility::factory()
                ->create(array_merge([
                    'user_id' => $owner->id,
                ], $data));

            Court::factory()->count(3)->create(['facility_id' => $facility->id]);
        }
    }
}
