<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
use App\Models\FacilityBilling;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminBillingReportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-11-16 10:00:00', config('app.timezone')));
    }

    private function booking(Facility $facility, array $attributes = []): Booking
    {
        $court = Court::factory()->flatPricing(300)->create(['facility_id' => $facility->id]);

        return Booking::query()->create(array_merge([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'user_id' => User::factory()->player()->create()->id,
            'date' => '2026-11-10',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'subtotal' => 300,
            'booking_fee' => 20,
            'total_price' => 320,
            'status' => 'confirmed',
        ], $attributes));
    }

    public function test_admin_can_view_monthly_booking_fee_totals_per_facility(): void
    {
        $admin = User::factory()->admin()->create();
        $facilityA = Facility::factory()->create(['name' => 'Alpha Courts']);
        $facilityB = Facility::factory()->create(['name' => 'Beta Arena']);

        $paid = $this->booking($facilityA, ['booking_fee' => 20, 'total_price' => 320]);
        $paid->payment()->create(['amount' => 320, 'payment_method' => 'gcash', 'status' => 'verified']);
        $this->booking($facilityA, ['booking_fee' => 30, 'total_price' => 330]);
        $this->booking($facilityB, ['booking_fee' => 10, 'total_price' => 310]);

        $this->actingAs($admin)
            ->get(route('admin.reports.billing'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/BillingReport')
                ->where('filters.month', '2026-11')
                ->where('summary.facilities', 2)
                ->where('summary.bookings', 3)
                ->where('summary.booking_fee', 60)
                ->where('summary.collected_fee', 20)
                ->where('summary.pending_fee', 40)
                ->where('facilities.0.name', 'Alpha Courts')
                ->where('facilities.0.bookings_count', 2)
                ->where('facilities.0.booking_fee', 50)
                ->where('facilities.0.collected_fee', 20)
                ->where('facilities.1.name', 'Beta Arena')
                ->where('facilities.1.booking_fee', 10));
    }

    public function test_report_excludes_cancelled_and_zero_fee_bookings(): void
    {
        $admin = User::factory()->admin()->create();
        $facility = Facility::factory()->create(['name' => 'Alpha Courts']);

        $this->booking($facility);
        $this->booking($facility, ['status' => 'cancelled']);
        $this->booking($facility, ['booking_fee' => 0, 'total_price' => 300]);

        $this->actingAs($admin)
            ->get(route('admin.reports.billing', ['month' => '2026-11']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('summary.bookings', 1)
                ->where('summary.booking_fee', 20));
    }

    public function test_report_can_be_filtered_by_month(): void
    {
        $admin = User::factory()->admin()->create();
        $facility = Facility::factory()->create(['name' => 'Alpha Courts']);

        $this->booking($facility, ['date' => '2026-10-05', 'booking_fee' => 25, 'total_price' => 325]);
        $this->booking($facility, ['date' => '2026-11-05', 'booking_fee' => 15, 'total_price' => 315]);

        $this->actingAs($admin)
            ->get(route('admin.reports.billing', ['month' => '2026-10']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.month', '2026-10')
                ->where('summary.bookings', 1)
                ->where('summary.booking_fee', 25));
    }

    public function test_selected_facility_returns_the_booking_breakdown(): void
    {
        $admin = User::factory()->admin()->create();
        $facility = Facility::factory()->create(['name' => 'Alpha Courts']);
        $otherFacility = Facility::factory()->create(['name' => 'Beta Arena']);

        $this->booking($facility, ['booking_fee' => 20, 'total_price' => 320]);
        $this->booking($facility, ['date' => '2026-11-11', 'booking_fee' => 25, 'total_price' => 325]);
        $this->booking($otherFacility, ['booking_fee' => 99, 'total_price' => 399]);

        $this->actingAs($admin)
            ->get(route('admin.reports.billing', ['month' => '2026-11', 'facility_id' => $facility->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('selectedFacility.id', $facility->id)
                ->where('filters.facility_id', $facility->id)
                ->has('breakdown', 2)
                ->where('breakdown.0.booking_fee', 20)
                ->where('breakdown.1.booking_fee', 25)
                ->where('breakdown.1.court', fn ($court) => is_string($court) && $court !== ''));
    }

    public function test_non_admin_users_cannot_view_the_report(): void
    {
        $this->actingAs(User::factory()->facilityOwner()->create())
            ->get(route('admin.reports.billing'))
            ->assertForbidden();

        $this->actingAs(User::factory()->player()->create())
            ->get(route('admin.reports.billing'))
            ->assertForbidden();
    }

    public function test_admin_can_mark_a_facility_as_billed_for_the_month(): void
    {
        $admin = User::factory()->admin()->create();
        $facility = Facility::factory()->create(['name' => 'Alpha Courts']);
        $this->booking($facility);

        $this->actingAs($admin)
            ->post(route('admin.reports.billing.status', $facility), [
                'period' => '2026-11',
                'status' => 'BILLED',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('facility_billings', [
            'facility_id' => $facility->id,
            'period' => '2026-11',
            'status' => 'BILLED',
            'billed_by' => $admin->id,
        ]);

        $this->actingAs($admin)
            ->get(route('admin.reports.billing', ['month' => '2026-11']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('facilities.0.billing_status', 'BILLED')
                ->where('summary.billed_facilities', 1)
                ->where('summary.billed_fee', 20)
                ->where('selectedFacility', null));
    }

    public function test_admin_can_mark_a_facility_as_not_billed(): void
    {
        $admin = User::factory()->admin()->create();
        $facility = Facility::factory()->create(['name' => 'Alpha Courts']);
        $this->booking($facility);

        FacilityBilling::query()->create([
            'facility_id' => $facility->id,
            'period' => '2026-11',
            'status' => 'BILLED',
            'billed_at' => now(),
            'billed_by' => $admin->id,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.reports.billing.status', $facility), [
                'period' => '2026-11',
                'status' => 'UNBILLED',
            ])
            ->assertRedirect();

        $billing = FacilityBilling::query()
            ->where('facility_id', $facility->id)
            ->where('period', '2026-11')
            ->firstOrFail();

        $this->assertSame('UNBILLED', $billing->status);
        $this->assertNull($billing->billed_at);
        $this->assertNull($billing->billed_by);

        $this->actingAs($admin)
            ->get(route('admin.reports.billing', ['month' => '2026-11']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('facilities.0.billing_status', 'UNBILLED')
                ->where('summary.unbilled_fee', 20));
    }

    public function test_billing_status_rejects_invalid_period_and_status(): void
    {
        $admin = User::factory()->admin()->create();
        $facility = Facility::factory()->create();

        $this->actingAs($admin)
            ->post(route('admin.reports.billing.status', $facility), [
                'period' => '2026/11',
                'status' => 'BILLED',
            ])
            ->assertSessionHasErrors('period');

        $this->actingAs($admin)
            ->post(route('admin.reports.billing.status', $facility), [
                'period' => '2026-11',
                'status' => 'PAID',
            ])
            ->assertSessionHasErrors('status');
    }

    public function test_non_admin_cannot_update_billing_status(): void
    {
        $facility = Facility::factory()->create();

        $this->actingAs(User::factory()->facilityOwner()->create())
            ->post(route('admin.reports.billing.status', $facility), [
                'period' => '2026-11',
                'status' => 'BILLED',
            ])
            ->assertForbidden();
    }
}
