import { useState } from 'react';
import { DEFAULT_SEARCH_RADIUS } from '../constants/parking';

// Home's parking type and search radius.
export const useFilterState = () => {
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchRadius, setSearchRadius] = useState(DEFAULT_SEARCH_RADIUS);

    return {
        activeFilter,
        setActiveFilter,
        searchRadius,
        setSearchRadius,
    };
};
