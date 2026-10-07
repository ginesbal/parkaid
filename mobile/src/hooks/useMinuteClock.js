import { useEffect, useState } from 'react';

/**
 * The current time, refreshed on each minute boundary — for clock times shown
 * to the minute ("Ends at 3:45 PM") when nothing faster is ticking. The value
 * is always within the real current minute, so what's displayed is exact.
 */
export function useMinuteClock() {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        let interval;
        const tick = () => setNow(Date.now());
        const align = setTimeout(() => {
            tick();
            interval = setInterval(tick, 60000);
        }, 60000 - (Date.now() % 60000));
        return () => {
            clearTimeout(align);
            clearInterval(interval);
        };
    }, []);

    return now;
}
