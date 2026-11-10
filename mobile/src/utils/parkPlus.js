// ParkAid keeps time; the City takes payment, in ParkPlus. Drivers pay
// street parking in the City's MyParking app (or at a pay station) with the
// zone number on the sign. These say so the same way everywhere.
//
// A MyParking session runs, and charges, until the driver ends it there (or
// their balance runs out), and the City doesn't refund one they forget to
// end. A pay station sells a set time. So ParkAid's Add changes nothing in
// MyParking, and ending ParkAid's timer doesn't end the MyParking session.

import { Platform } from 'react-native';
import { formatMoney } from './formatters';
import { formatDuration } from './sessionHelpers';

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
// says what the extra time costs, and where. `cost`: 0 when the City does not
// charge then, null when the rate is unknown.
export function getExtendNote({ cost, zone }) {
    if (cost === 0) return 'Timer only. Free at that time.';
    if (cost === null || cost === undefined) return 'Timer only. What you paid for doesn’t change.';
    return `Timer only. ${formatMoney(cost)} more ${zone ? 'in ParkPlus' : 'where you paid'}.`;
}

// Once time is added: only time bought for a set length needs more bought.
export function getAddedNote(minutes) {
    return `Paid for a set time? Buy ${formatDuration(minutes)} more where you paid.`;
}

// Once time is up: the one thing to do, and the MyParking session that is
// still running.
export function getExpiredLine(session) {
    return getSessionZone(session)
        ? 'Move your car. Paid in MyParking? End your session there too.'
        : 'Move your car, or pay for more time where you paid.';
}

// When ParkAid's session ends, for a street zone: the MyParking session to
// end too. null when there is none to end.
export function getEndNote(session) {
    return getSessionZone(session)
        ? 'Paid in MyParking? End your session there too, so you only pay for the time you parked.'
        : null;
}

// The same for a stored session, whose spotId is its zone or its lot kind.
export function getSessionPayLine(session) {
    const zone = getSessionZone(session);
    return getPayLine({ zone, lot: !zone && /lot|parkade/i.test(session?.spotId || '') });
}
