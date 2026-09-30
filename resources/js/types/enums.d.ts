/**
 * User roles supported across CourtSync.
 */
export type UserRole = 'ADMIN' | 'FACILITY_OWNER' | 'FACILITY_STAFF' | 'PLAYER';

/**
 * Sub-roles for facility staff members.
 */
export type StaffRole = 'MANAGER' | 'RECEPTIONIST' | 'CASHIER';

/**
 * User account status.
 */
export type UserStatus = 'PENDING' | 'VERIFIED' | 'BANNED' | 'INACTIVE';

/**
 * Granular permissions that can be granted to facility staff by owners.
 */
export type StaffPermissionKey =
    | 'view_players'
    | 'manage_players'
    | 'view_courts'
    | 'create_courts'
    | 'edit_courts'
    | 'delete_courts';

/**
 * Facility verification statuses.
 */
export type VerificationStatus =
    | 'DRAFT'
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'SUSPENDED';

/**
 * Court operational statuses.
 */
export type CourtStatus =
    | 'AVAILABLE'
    | 'OPEN_PLAY'
    | 'BLOCKED'
    | 'NOT_AVAILABLE';

/**
 * Booking lifecycle statuses.
 */
export type BookingStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'CHECKED_IN'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'NO_SHOW';

/**
 * Payment processing statuses.
 */
export type PaymentStatus =
    | 'PENDING'
    | 'PAID'
    | 'FAILED'
    | 'REFUNDED'
    | 'PARTIALLY_REFUNDED';

/**
 * Supported payment methods (PH-first).
 */
export type PaymentMethod =
    | 'GCASH'
    | 'MAYA'
    | 'QR_PH'
    | 'CARD'
    | 'CASH'
    | 'BANK_TRANSFER';

/**
 * Supported sport types.
 */
export type SportType =
    | 'Badminton'
    | 'Basketball'
    | 'Tennis'
    | 'Pickleball'
    | 'Volleyball'
    | 'Futsal'
    | 'Table Tennis';
