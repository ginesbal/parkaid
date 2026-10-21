// SessionContext — one parking session for the whole app, so Home and Map
// can show that you are parked, not only the Park tab.
//
// useSession():       everything from useSessionManager; changes every second
// useSessionStatus(): { isLoaded, active, state }; changes only when a
//                     session starts, ends or turns (active, expiring,
//                     expired), so the tabs do not re-render every second

import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useSessionManager } from '../hooks/useSessionManager';
import { formatClock } from '../utils/sessionHelpers';

const SessionContext = createContext(null);
const SessionStatusContext = createContext({ isLoaded: false, active: false, state: null });

export const useSession = () => useContext(SessionContext);
export const useSessionStatus = () => useContext(SessionStatusContext);

export function SessionProvider({ children }) {
    const manager = useSessionManager();
    const { isLoaded, session, sessionState, endTime } = manager;
    const active = Boolean(session);
    const state = active ? sessionState : null;

    const status = useMemo(() => ({ isLoaded, active, state }), [isLoaded, active, state]);

    // Say it when the session turns, wherever the driver is in the app; a
    // view appearing on the Park tab is not announced on its own.
    const lastState = useRef(state);
    useEffect(() => {
        const previous = lastState.current;
        lastState.current = state;
        if (!previous || previous === state) return;
        if (state === 'expiring') {
            AccessibilityInfo.announceForAccessibility?.(`Time to head back. Your parking ends at ${formatClock(endTime)}.`);
        } else if (state === 'expired') {
            AccessibilityInfo.announceForAccessibility?.('Your parking time is up.');
        }
    }, [state, endTime]);

    return (
        <SessionStatusContext.Provider value={status}>
            <SessionContext.Provider value={manager}>{children}</SessionContext.Provider>
        </SessionStatusContext.Provider>
    );
}
