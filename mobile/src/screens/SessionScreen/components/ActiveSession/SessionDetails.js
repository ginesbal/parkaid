import { Text, View } from 'react-native';
import { formatEndTime } from '../../../../utils/formatters';
import { formatDuration } from '../../../../utils/spotInfo';
import { styles } from './styles';

/**
 * SessionDetails — what the timer is for. Spot rows only appear when the
 * timer was started for a spot.
 */
const SessionDetails = ({ session, elapsedTime }) => {
    const spot = session.spot;
    const started = formatEndTime(new Date(session.startedAt));
    const ago = elapsedTime > 0 ? `${formatDuration(elapsedTime)} ago` : 'just now';

    const rows = [
        spot?.address && { label: 'Spot', value: spot.address, subvalue: spot.secondary },
        spot?.priceText && { label: 'Rate', value: spot.priceText },
        spot?.maxStayText && { label: 'Time limit', value: spot.maxStayText },
        { label: 'Started', value: `${started} · ${ago}` },
    ].filter(Boolean);

    return (
        <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Details</Text>

            {rows.map((row, index) => (
                <View
                    key={row.label}
                    style={[styles.detailRow, index === rows.length - 1 && styles.detailRowLast]}
                    accessible
                    accessibilityLabel={[row.label, row.value, row.subvalue].filter(Boolean).join(', ')}
                >
                    <Text style={styles.detailLabel}>{row.label}</Text>
                    <View style={styles.detailValueWrap}>
                        <Text style={styles.detailValue}>{row.value}</Text>
                        {row.subvalue ? (
                            <Text style={styles.detailSubvalue}>{row.subvalue}</Text>
                        ) : null}
                    </View>
                </View>
            ))}
        </View>
    );
};

export default SessionDetails;
