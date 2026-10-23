// Parking type and search distance, the same on Home and Map (shared through
// context/FilterContext). The API knows street, off-street and permit; Lot
// and Parkade both ask it for off-street parking and are told apart here.

import { isCovered } from './spotPresentation';

export const TYPE_OPTIONS = [
    { key: 'all', label: 'All' },
    { key: 'on_street', label: 'Street' },
    { key: 'lot', label: 'Lot' },
    { key: 'parkade', label: 'Parkade' },
    { key: 'residential', label: 'Permit' },
];

// Four stops so a row fits a phone without hiding the widest option.
export const DISTANCE_OPTIONS = [150, 250, 500, 1000];

export const getTypeLabel = (type) => TYPE_OPTIONS.find((option) => option.key === type)?.label ?? 'All';

// The type to ask the API for.
export function apiTypeFor(type) {
    return type === 'lot' || type === 'parkade' ? 'off_street' : type;
}

// The API's answer, narrowed to the type picked.
export function applyType(spots, type) {
    const list = Array.isArray(spots) ? spots : [];
    if (type === 'parkade') return list.filter(isCovered);
    if (type === 'lot') return list.filter((spot) => !isCovered(spot));
    return list;
}
