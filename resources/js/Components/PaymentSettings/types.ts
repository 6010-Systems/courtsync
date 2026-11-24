import React from 'react';

export type PaymentMethod = 'gcash' | 'maya';

export interface Facility {
    id: number;
    name: string;
    user_id?: number;
    gcash_name?: string | null;
    gcash_number?: string | null;
    gcash_qr_url?: string | null;
    maya_name?: string | null;
    maya_number?: string | null;
    maya_qr_url?: string | null;
    [key: string]: any;
}

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    facilities?: Facility[];
    [key: string]: any;
}

export interface PaymentSettingsProps {
    auth: {
        user: AuthUser;
    };
}

export interface PaymentFormData {
    gcash_name: string;
    gcash_number: string;
    gcash_qr: File | null;
    maya_name: string;
    maya_number: string;
    maya_qr: File | null;
}

export interface MethodTileProps {
    id: PaymentMethod;
    name: string;
    subtitle: string;
    wordmarkColor?: string;
    selected: boolean;
    isConfigured: boolean;
    isPartiallyConfigured?: boolean;
    onSelect: (id: PaymentMethod) => void;
}

export interface QrDropzoneProps {
    method: PaymentMethod;
    methodName: string;
    currentFile: File | null;
    currentPreviewUrl: string | null;
    error?: string;
    onFileSelect: (file: File) => void;
    onFileRemove: () => void;
    disabled?: boolean;
}

export interface PaymentPreviewProps {
    method: PaymentMethod;
    accountName: string;
    accountNumber: string;
    qrPreviewUrl: string | null;
    facilityName: string;
}

export interface SaveBarProps {
    isDirty: boolean;
    isProcessing: boolean;
    onSave: () => void;
    onDiscard: () => void;
}

export interface ToastService {
    (options: any): number;
    addToast: (options: any) => number;
    dismiss: (id: number) => void;
    success: (message: string, opts?: any) => number;
    error: (message: string, opts?: any) => number;
    warning: (message: string, opts?: any) => number;
    info: (message: string, opts?: any) => number;
}

export interface ConfirmService {
    confirm: (options: {
        title?: string;
        message?: string;
        confirmText?: string;
        cancelText?: string | null;
        type?: 'success' | 'danger' | 'warning' | 'info';
    }) => Promise<boolean>;
}

