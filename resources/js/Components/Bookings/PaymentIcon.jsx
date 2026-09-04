import React from 'react';
import {
    Zap,
    Banknote,
    Wallet,
    QrCode,
    CreditCard,
} from 'lucide-react';

export default function PaymentIcon({
    method = 'CASH',
    size = 14,
    className = '',
}) {
    switch (method) {
        case 'GCASH':
            return <Zap size={size} className={className} strokeWidth={2.3} />;
        case 'CASH':
            return <Banknote size={size} className={className} strokeWidth={2.3} />;
        case 'MAYA':
            return <Wallet size={size} className={className} strokeWidth={2.3} />;
        case 'QRPH':
            return <QrCode size={size} className={className} strokeWidth={2.3} />;
        case 'CARD':
        default:
            return <CreditCard size={size} className={className} strokeWidth={2.3} />;
    }
}
