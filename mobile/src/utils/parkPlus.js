// ParkAid keeps time; the City takes payment, in ParkPlus. Drivers pay
// street parking in the City's MyParking app (or at a pay station) with the
// zone number on the sign. These say so the same way everywhere.

import { Platform } from 'react-native';
import { formatMoney } from './formatters';

// MyParking, the City's ParkPlus app. Its store page opens the app when it is
// installed; web goes to the City's page about it.
export const PARKPLUS_APP_URL = Platform.select({
    ios: 'https://apps.apple.com/ca/app/myparking/id1001301657',
    android: 'https://play.google.com/store/apps/details?id=com.cpa.accountManagement',
    default: 'https://www.calgaryparking.com/purchase-parking/parkplus/account/mobile-app.html',
});

// "Zone 1684" from a stored session's spotId. Street sessions carry their
// zone there; lots carry their kind ("Parkade", "Surface lot").
export function getSessionZone(session) {
    const spotId = session?.spotId || '';
    return /^Zone /.test(spotId) ? spotId : null;
}

// "1684" from "Zone 1684": what the driver types into ParkPlus.
export function getZoneNumber(zoneLabel) {
    return (zoneLabel || '').replace(/^Zone\s*/i, '');
}

// Said above Start and on the running session, so no one thinks that
// starting the timer paid for the spot.
export function getPayLine({ zone = null, lot = false } = {}) {
    if (zone) return `ParkAid only keeps time. Pay in ParkPlus with ${zone.toLowerCase()}.`;
    if (lot) return 'ParkAid only keeps time. Pay at the lot.';
    return 'ParkAid only keeps time. Pay at the meter or in ParkPlus.';
}

// Under Add on a running session. Add changes ParkAid's timer only, so it
// says what to pay, and where. `cost`: what the added time costs; 0 when the
// City does not charge then, null when the rate is unknown.
export function getExtendNote({ cost, zone }) {
    const where = zone ? 'in ParkPlus' : 'where you paid';
    if (cost === 0) return 'Timer only. Free at that time.';
    if (cost === null || cost === undefined) return `Timer only. Add the same time ${where}.`;
    return `Timer only. Pay ${formatMoney(cost)} more ${where}.`;
}

// Once time is up: the one thing to do.
export function getExpiredLine(session) {
    const zone = getSessionZone(session);
    return zone
        ? `Move your car, or add time in ParkPlus with ${zone.toLowerCase()}.`
        : 'Move your car, or add time where you paid.';
}

// The same for a stored session, whose spotId is its zone or its lot kind.
export function getSessionPayLine(session) {
    const zone = getSessionZone(session);
    return getPayLine({ zone, lot: !zone && /lot|parkade/i.test(session?.spotId || '') });
}
