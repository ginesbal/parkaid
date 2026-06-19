import { Text, View } from 'react-native';
import { styles } from './styles';

const QuickInfoBar = ({ quickInfo }) => {
    if (!quickInfo) return null;

    const showNearest = quickInfo.nearest && quickInfo.nearest.walkingTime;
    const showPrice = quickInfo.averagePrice !== null && quickInfo.averagePrice > 0;

    let displayValue, displayLabel;

    if (showNearest) {
        const mins = quickInfo.nearest.walkingTime;
        displayValue = `${mins}`;
        displayLabel = `${mins === 1 ? 'minute' : 'minutes'} to closest spot`;
    } else if (quickInfo.total > 0) {
        displayValue = `${quickInfo.total}`;
        displayLabel = quickInfo.total === 1 ? 'parking spot nearby' : 'parking spots nearby';
    } else {
        return null;
    }

    return (
        <View style={styles.quickInfoBar}>
            <View style={styles.quickInfoItem}>
                <Text style={styles.quickInfoValue}>{displayValue}</Text>
                <Text style={styles.quickInfoLabel}>{displayLabel}</Text>
            </View>
            {showPrice ? (
                <View style={styles.quickInfoMeta}>
                    <Text style={styles.quickInfoMetaLabel}>Average</Text>
                    <Text style={styles.quickInfoMetaValue}>
                        ${Number(quickInfo.averagePrice).toFixed(2)} per hour
                    </Text>
                </View>
            ) : null}
        </View>
    );
};

export default QuickInfoBar;
