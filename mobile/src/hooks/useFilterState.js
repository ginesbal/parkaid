import { useState } from 'react';

// Home's parking-type filter. How far you'll walk is shared with the map and
// lives in useWalkMinutes.
export const useFilterState = () => {
    const [activeFilter, setActiveFilter] = useState('all');
    return { activeFilter, setActiveFilter };
};
