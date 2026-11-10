import ScreenStatusBar from '../../../../components/ScreenStatusBar';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandLoader from '../../../../components/BrandLoader';
import LiveStage from '../../../../components/LiveStage';
import { getDistanceLabel } from '../../../../utils/parkingHelpers';
import { styles } from './styles';

/**
 * LoadingState - first load of Home: the live Spline pin jumps while we find
 * the driver, then the spots around them. The pin is big enough to carry the
 * screen, so the Spline badge in the corner reads as a footer.
 */
const PIN_SIZE = 140;
const LoadingState = ({ searchRadius, phase = 'spots' }) => (
    <SafeAreaView style={styles.fullScreenBg} edges={['top', 'left', 'right', 'bottom']}>
        <ScreenStatusBar style="dark" />
        <LiveStage style={styles.loadingContainer}>
            {phase === 'location' ? (
                <BrandLoader size={PIN_SIZE} label="Finding where you are" live />
            ) : (
                <BrandLoader
                    size={PIN_SIZE}
                    live
                    label="Looking for parking nearby"
                    sublabel={`Checking within ${getDistanceLabel(searchRadius)} of you`}
                />
            )}
        </LiveStage>
    </SafeAreaView>
);

export default LoadingState;
