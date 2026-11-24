import React from 'react';
import BasketballIcon from '@/Components/Icons/BasketballIcon';
import PickleballIcon from '@/Components/Icons/PickleballIcon';

/**
 * Universal Sport Icon for badges, headers, and timeline markers.
 * Standardized across CourtSync for Basketball, Pickleball, Badminton, Tennis, Volleyball, and Futsal.
 */
export default function SportIcon({ sportType = '', size = 20, className = '', stroke = '#101F1A' }) {
    const norm = (sportType || '').toLowerCase().trim();

    if (norm.includes('basketball')) {
        return (
            <BasketballIcon 
                size={size} 
                className={className} 
                stroke={stroke} 
                strokeWidth={2} 
            />
        );
    }

    if (norm.includes('badminton')) {
        return (
            <svg 
                viewBox="0 0 32 32" 
                width={size} 
                height={size} 
                className={className} 
                aria-label="Badminton Shuttlecock"
            >
                <path d="M 9 9 L 23 9 L 19 23 L 13 23 Z" fill="#F8FAFC" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
                <line x1="13" y1="9" x2="15" y2="23" stroke="#CBD5E1" strokeWidth="1.3" />
                <line x1="16" y1="9" x2="16" y2="23" stroke="#CBD5E1" strokeWidth="1.3" />
                <line x1="19" y1="9" x2="17" y2="23" stroke="#CBD5E1" strokeWidth="1.3" />
                <line x1="10.5" y1="15" x2="21.5" y2="15" stroke={stroke} strokeWidth="1.5" />
                <path d="M 13 23 C 13 27 19 27 19 23 Z" fill="#E2E8F0" stroke={stroke} strokeWidth="1.8" />
            </svg>
        );
    }

    if (norm.includes('tennis') || norm.includes('padel')) {
        return (
            <svg 
                viewBox="0 0 32 32" 
                width={size} 
                height={size} 
                className={className} 
                aria-label="Tennis Ball"
            >
                <circle cx="16" cy="16" r="14" fill="#D6FF3F" stroke={stroke} strokeWidth="2" />
                <path d="M 6.1 6.1 C 13 11 13 21 6.1 25.9" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
                <path d="M 6.1 6.1 C 13 11 13 21 6.1 25.9" fill="none" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M 25.9 6.1 C 19 11 19 21 25.9 25.9" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
                <path d="M 25.9 6.1 C 19 11 19 21 25.9 25.9" fill="none" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
        );
    }

    if (norm.includes('volleyball')) {
        return (
            <svg 
                viewBox="0 0 32 32" 
                width={size} 
                height={size} 
                className={className} 
                aria-label="Volleyball"
            >
                <circle cx="16" cy="16" r="14" fill="#F8FAFC" stroke={stroke} strokeWidth="2" />
                <path d="M 16 2 C 16 16 2 16 2 16" fill="none" stroke={stroke} strokeWidth="1.6" />
                <path d="M 16 30 C 16 16 30 16 30 16" fill="none" stroke={stroke} strokeWidth="1.6" />
                <path d="M 2 16 C 16 16 26 26 26 26" fill="none" stroke={stroke} strokeWidth="1.6" />
            </svg>
        );
    }

    if (norm.includes('futsal') || norm.includes('soccer')) {
        return (
            <svg 
                viewBox="0 0 32 32" 
                width={size} 
                height={size} 
                className={className} 
                aria-label="Futsal Ball"
            >
                <circle cx="16" cy="16" r="14" fill="#FFFFFF" stroke={stroke} strokeWidth="2" />
                <polygon points="16,8 22,13 20,20 12,20 10,13" fill={stroke} />
                <line x1="16" y1="8" x2="16" y2="2" stroke={stroke} strokeWidth="1.6" />
                <line x1="22" y1="13" x2="28" y2="10" stroke={stroke} strokeWidth="1.6" />
                <line x1="20" y1="20" x2="25" y2="26" stroke={stroke} strokeWidth="1.6" />
                <line x1="12" y1="20" x2="7" y2="26" stroke={stroke} strokeWidth="1.6" />
                <line x1="10" y1="13" x2="4" y2="10" stroke={stroke} strokeWidth="1.6" />
            </svg>
        );
    }

    return (
        <PickleballIcon 
            size={size} 
            className={className} 
            stroke={stroke} 
            strokeWidth={18} 
            withHoleBorders={true} 
        />
    );
}
