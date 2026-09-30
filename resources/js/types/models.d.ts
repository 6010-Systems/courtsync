import {
    UserRole,
    StaffRole,
    UserStatus,
    StaffPermissionKey,
    VerificationStatus,
    CourtStatus,
    BookingStatus,
    PaymentStatus,
    PaymentMethod,
    SportType,
} from './enums';

/**
 * Base timestamps for Eloquent models.
 */
export interface Timestamps {
    created_at: string;
    updated_at: string;
}

/**
 * Core User entity representation.
 */
export interface User extends Timestamps {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    role: UserRole;
    staff_role: StaffRole | null;
    status: UserStatus;
    mobile_number: string | null;
    google_id: string | null;
    avatar: string | null;
    facility_id: number | null;
    permissions: StaffPermissionKey[] | null;

    // Relationships (optional / conditionally loaded)
    facilities?: Facility[];
    work_facility?: Facility | null;
    workFacility?: Facility | null;
    joined_facilities?: Facility[];
}

/**
 * Facility Verification document bundle.
 */
export interface FacilityVerification extends Timestamps {
    id: number;
    facility_id: number;
    government_id_type: string;
    government_id_number: string;
    government_id_image_path: string;
    business_permit_path: string;
    business_registration_path: string;
    proof_of_ownership_path: string;
    facility_photos: string[];

    // Relationship
    facility?: Facility;
}

/**
 * Sports Facility entity representation.
 */
export interface Facility extends Timestamps {
    id: number;
    user_id: number;
    slug: string | null;
    name: string;
    address: string;
    city: string;
    province: string;
    country: string;
    contact_number: string;
    description: string | null;
    verification_status: VerificationStatus;

    // Aggregates & Relationships
    staff_count?: number;
    players_count?: number;
    courts_count?: number;
    owner?: User;
    verification?: FacilityVerification | null;
    courts?: Court[];
    staff?: User[];
    players?: (User & { pivot: { status: 'ACTIVE' | 'BANNED'; created_at: string } })[];
}

/**
 * Court entity representation.
 */
export interface Court extends Timestamps {
    id: number;
    facility_id: number;
    name: string;
    type: SportType | string | null;
    time_range: string | null;
    description: string | null;
    hourly_rate: number | string | null;
    status: CourtStatus;

    // Relationship
    facility?: Facility;
}

/**
 * Flattened player row displayed in Facility Owner's player management table.
 */
export interface FacilityPlayerRow {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    created_at: string;
    facility_id: number;
    facility_name: string;
    status: 'ACTIVE' | 'BANNED';
}

/**
 * Staff permission matrix structure used by the permission editor.
 */
export interface PermissionMatrixItem {
    view: StaffPermissionKey | null;
    create: StaffPermissionKey | null;
    edit: StaffPermissionKey | null;
    delete: StaffPermissionKey | null;
}

export type PermissionMatrix = Record<string, PermissionMatrixItem>;

/**
 * Booking entity representation.
 */
export interface Booking extends Timestamps {
    id: number;
    facility_id: number;
    court_id: number;
    user_id: number;
    booking_code: string;
    start_time: string;
    end_time: string;
    status: BookingStatus;
    total_amount: number;
    payment_status: PaymentStatus;
    payment_method: PaymentMethod | null;
    notes: string | null;

    // Relationships
    facility?: Facility;
    court?: Court;
    user?: User;
}

/**
 * Audit log for verification and security actions.
 */
export interface AuditLog {
    id: number;
    user_id: number;
    facility_id: number | null;
    action: string;
    previous_status: string | null;
    new_status: string | null;
    reason: string | null;
    ip_address: string;
    user_agent: string;
    created_at: string;

    user?: User;
    facility?: Facility;
}
