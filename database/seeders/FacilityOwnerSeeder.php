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
            ->has(Facility::factory()->count(2)->state(function (array $attributes, User $user) {
                return [
                    'gcash_name' => 'CourtSync Demo',
                    'gcash_number' => '0912 345 6789',
                    'gcash_qr_url' => 'https://res.cloudinary.com/dwnu9lxd7/image/upload/v1790433960/gcashqr_zynbos.jpg',
                    'maya_name' => 'CourtSync Demo',
                    'maya_number' => '0912 345 6789',
                    'maya_qr_url' => 'https://res.cloudinary.com/dwnu9lxd7/image/upload/v1790433959/mayaqr_wv3fzq.jpg',
                ];
            }), 'facilities')
            ->create([
                'name' => 'Owner Demo',
                'email' => 'owner@example.com',
            ]);

        $demoOwner->facilities->each(function (Facility $facility) {
            Court::factory()->count(2)->create(['facility_id' => $facility->id]);
            Court::factory()->openPlay()->create(['facility_id' => $facility->id]);
            Court::factory()->blocked()->create(['facility_id' => $facility->id]);
        });

        // Create a sample booking and payment for the first facility to test receipt viewing
        $firstFacility = $demoOwner->facilities->first();
        $court = $firstFacility->courts->first();

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

        User::factory()
            ->count(3)
            ->facilityOwner()
            ->has(Facility::factory(), 'facilities')
            ->create()
            ->each(function (User $owner) {
                Court::factory()->count(3)->create(['facility_id' => $owner->facilities()->first()->id]);
            });
    }
}
