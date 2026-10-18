import ScreenStatusBar from '../../../../components/ScreenStatusBar';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandLoader from '../../../../components/BrandLoader';
import LiveStage from '../../../../components/LiveStage';
import { getDistanceLabel } from '../../../../utils/parkingHelpers';
import { styles } from './styles';

/**
 * LoadingState - first load of Home: the live Spline pin jumps while we find
 * the driver, then the spots around them.
 */
const LoadingState = ({ searchRadius, phase = 'spots' }) => (
    <SafeAreaView style={styles.fullScreenBg} edges={['top', 'left', 'right', 'bottom']}>
        <ScreenStatusBar style="dark" />
        <LiveStage style={styles.loadingContainer}>
            {phase === 'location' ? (
                <BrandLoader size={96} label="Finding where you are" live />
            ) : (
                <BrandLoader
                    size={96}
                    live
                    label="Looking for spots nearby"
                    sublabel={`Checking within ${getDistanceLabel(searchRadius)} of you`}
                />
            )}
        </LiveStage>
    </SafeAreaView>
);

export default LoadingState;
