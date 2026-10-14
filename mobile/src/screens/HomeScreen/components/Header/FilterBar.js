import React from 'react';
import { View } from 'react-native';
import TypeSwitch from '../../../../components/Filters/TypeSwitch';
import WalkSlider from '../../../../components/Filters/WalkSlider';
import { styles } from './styles';

// Two quiet controls: which kind of parking, and how far you'll walk. The
// walk is a free choice (any minute from 1 to 25), shared with the map.
const FilterBar = ({
    activeFilter,
    setActiveFilter,
    walkMinutes,
    setWalkMinutes,
}) => (
    <View style={styles.filterBar}>
        <TypeSwitch value={activeFilter} onChange={setActiveFilter} stretch />
        <WalkSlider minutes={walkMinutes} onChange={setWalkMinutes} />
    </View>
);

export default React.memo(FilterBar);
