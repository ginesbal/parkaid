// useMinute — the time, updated on each new minute. For screens whose words
// and order depend on the clock ("No parking from 3:30 PM") without
// re-rendering every second.

import { useEffect, useState } from 'react';

const untilNextMinute = () => 60000 - (Date.now() % 60000) + 50;

export function useMinute() {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        let timer;
        const tick = () => {
            setNow(Date.now());
            timer = setTimeout(tick, untilNextMinute());
        };
        timer = setTimeout(tick, untilNextMinute());
        return () => clearTimeout(timer);
    }, []);
    return now;
}
