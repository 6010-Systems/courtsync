import React from 'react';
import PickleballIcon from '@/Components/Icons/PickleballIcon';
import {
    Activity,
    CircleDot,
    Flame,
    Disc,
    Trophy,
    Sparkles,
} from 'lucide-react';

export default function SportIcon({
    sport = 'Badminton',
    size = 14,
    className = '',
}) {
    switch (sport) {
        case 'Badminton':
            return <Activity size={size} className={className} strokeWidth={2.3} />;
        case 'Futsal':
            return <CircleDot size={size} className={className} strokeWidth={2.3} />;
        case 'Pickleball':
            return <PickleballIcon size={size} className={className} />;
        case 'Basketball':
            return <Flame size={size} className={className} strokeWidth={2.3} />;
        case 'Volleyball':
            return <Sparkles size={size} className={className} strokeWidth={2.3} />;
        case 'Table Tennis':
            return <Disc size={size} className={className} strokeWidth={2.3} />;
        default:
            return <Trophy size={size} className={className} strokeWidth={2.3} />;
    }
}
