// SpotMap (web) — react-native-maps has no web renderer here, and a drawn
// tile would look the same for every spot, so web shows no map. The View
// keeps the caller's spacing.

import { View } from 'react-native';

export default function SpotMap({ style }) {
    return <View style={style} />;
}
