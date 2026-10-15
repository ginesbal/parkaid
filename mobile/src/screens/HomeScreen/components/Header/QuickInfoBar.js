import { Text } from 'react-native';
import { styles } from './styles';

/**
 * QuickInfoBar — one plain sentence about what's nearby. Numbers get weight,
 * not size: a summary, not a dashboard stat.
 */
const QuickInfoBar = ({ quickInfo }) => {
    if (!quickInfo) return null;

    const mins = quickInfo.nearest?.walkingTime;
    const showPrice = quickInfo.averagePrice !== null && quickInfo.averagePrice > 0;

    let lead;
    if (mins) {
        lead = (
            <>
                <Text style={styles.quickInfoStrong}>{mins}-minute walk</Text> to the closest spot
            </>
        );
    } else if (quickInfo.total > 0) {
        lead = (
            <>
                <Text style={styles.quickInfoStrong}>{quickInfo.total}</Text>
                {quickInfo.total === 1 ? ' spot nearby' : ' spots nearby'}
            </>
        );
    } else {
        return null;
    }

    return (
        <Text style={styles.quickInfoLine}>
            {lead}
            {showPrice ? (
                <>
                    {' · average '}
                    <Text style={styles.quickInfoStrong}>
                        ${Number(quickInfo.averagePrice).toFixed(2)}
                    </Text>
                    {' per hour'}
                </>
            ) : null}
        </Text>
    );
};

export default QuickInfoBar;
