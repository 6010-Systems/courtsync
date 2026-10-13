import {
    User,
    Facility,
    Court,
    FacilityVerification,
    FacilityPlayerRow,
    PermissionMatrix,
} from './models';
import { StaffPermissionKey } from './enums';

/**
 * Common shared Inertia page props.
 */
export interface AuthProps {
    user: User;
}

export interface FlashMessages {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
    status?: string;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: AuthProps;
    flash?: FlashMessages;
    errors?: Record<string, string>;
};

// ── Admin Page Props ─────────────────────────────────────────────────────────

export interface AdminStats {
    totalOwners: number;
    totalStaff: number;
    totalPlayers: number;
    totalFacilities: number;
    approvedFacilities: number;
    pendingVerifications: number;
}

export interface AdminDashboardProps extends PageProps {
    adminStats: AdminStats;
}

export interface AdminFacilitiesProps extends PageProps {
    facilities: Facility[];
    owners: User[];
}

export interface AdminCourtsProps extends PageProps {
    facilities: Facility[];
}

export interface AdminOwnersProps extends PageProps {
    users: User[];
}

export interface AdminStaffProps extends PageProps {
    users: User[];
    facilities: Facility[];
}

export interface AdminVerificationsProps extends PageProps {
    verifications: (FacilityVerification & { facility: Facility })[];
}

// ── Facility Owner & Staff Page Props ───────────────────────────────────────

export interface FacilityOwnerDashboardProps extends PageProps {
    user: User;
}

export interface FacilityOwnerFacilitiesProps extends PageProps {
    facilities: Facility[];
}

export interface FacilityOwnerCourtsProps extends PageProps {
    facilities: Facility[];
    can: {
        create: boolean;
        edit: boolean;
        delete: boolean;
    };
}

export interface FacilityOwnerStaffProps extends PageProps {
    // auth.user has facilities.staff loaded
}

export interface FacilityOwnerStaffPermissionsProps extends PageProps {
    staff: Pick<User, 'id' | 'name' | 'email'>;
    matrix: PermissionMatrix;
    permissions: StaffPermissionKey[];
}

export interface FacilityOwnerPlayersProps extends PageProps {
    players: FacilityPlayerRow[];
    canManage: boolean;
}

// ── Player & Public Page Props ──────────────────────────────────────────────

export interface PlayerShowProps extends PageProps {
    facility: Facility;
}

export interface PlayerAuthLoginProps extends PageProps {
    facility: Facility;
    canResetPassword?: boolean;
    status?: string;
    lastLoginMethod?: string;
}

export interface PlayerAuthRegisterProps extends PageProps {
    facility: Facility;
}

export interface WelcomeProps extends PageProps {
    canLogin: boolean;
    canRegister: boolean;
    laravelVersion: string;
    phpVersion: string;
    facilities: Pick<Facility, 'id' | 'name' | 'slug' | 'city' | 'province' | 'description' | 'verification'>[];
}
