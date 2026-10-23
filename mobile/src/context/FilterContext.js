// FilterContext — the parking type and search distance, set on Home or on
// Map and kept when moving between them (see utils/filters).

import { createContext, useContext, useMemo, useState } from 'react';
import { DEFAULT_SEARCH_RADIUS } from '../constants/parking';

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
    const [type, setType] = useState('all');
    const [radius, setRadius] = useState(DEFAULT_SEARCH_RADIUS);
    const value = useMemo(() => ({ type, setType, radius, setRadius }), [type, radius]);
    return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

// { type, setType, radius, setRadius }
export const useFilters = () => useContext(FilterContext);
