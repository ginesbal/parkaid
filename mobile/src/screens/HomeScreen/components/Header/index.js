import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import BrandPin3D from '../../../../components/BrandPin3D';
import { SPLINE_SCENES } from '../../../../constants/spline';
import { TOKENS } from '../../../../constants/theme';
import TopPick from '../TopPick';
import FilterBar from './FilterBar';
import ViewChips from './ViewChips';
import { styles } from './styles';

/**
 * Home header: greeting, search, view chips, optional filters, and the top pick.
 * Everything above the list rows.
 */
const Header = ({
    greeting,
    statusMessage,
    statusTone = 'info',
    onSearchPress,
    view,
    onViewChange,
    filtersOpen,
    onToggleFilters,
    filterCount,
    activeFilter,
    setActiveFilter,
    searchRadius,
    setSearchRadius,
    topPick,
    onViewSpot,
    moreCount,
    isUpdating,
    pinSuspended,
}) => {
    const filterLabel = filterCount > 0 ? `Filters, ${filterCount} active` : 'Filters';

    return (
        <View style={styles.header}>
            <View style={styles.greetingRow}>
                <Text style={styles.greeting} accessibilityRole="header">
                    {greeting.hello}{'\n'}{greeting.ask}
                </Text>
                <BrandPin3D
                    scene={SPLINE_SCENES.pin}
                    size={52}
                    suspended={pinSuspended}
                    style={styles.greetingPin}
                />
            </View>

            {statusMessage ? (
                <View
                    style={[
                        styles.statusBanner,
                        statusTone === 'warning' ? styles.statusBannerWarning : styles.statusBannerInfo,
                    ]}
                    accessibilityRole="alert"
                >
                    <MaterialCommunityIcons
                        name={statusTone === 'warning' ? 'wifi-alert' : 'crosshairs-question'}
                        size={16}
                        color={statusTone === 'warning' ? TOKENS.warning : TOKENS.primary}
                    />
                    <Text style={styles.statusBannerText}>{statusMessage}</Text>
                </View>
            ) : null}

            <View style={styles.searchRow}>
                <Pressable
                    onPress={onSearchPress}
                    style={({ pressed }) => [styles.search, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Search Calgary"
                    accessibilityHint="Opens the map with search"
                >
                    <MaterialCommunityIcons name="magnify" size={20} color={TOKENS.textMuted} />
                    <Text style={styles.searchText}>Search Calgary</Text>
                </Pressable>

                <Pressable
                    onPress={onToggleFilters}
                    style={({ pressed }) => [
                        styles.filterButton,
                        filtersOpen && styles.filterButtonOpen,
                        pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={filterLabel}
                    aria-expanded={filtersOpen}
                >
                    <MaterialCommunityIcons
                        name="tune-variant"
                        size={20}
                        color={filtersOpen ? TOKENS.primaryInk : TOKENS.text}
                    />
                    {filterCount > 0 ? (
                        <View style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>{filterCount}</Text>
                        </View>
                    ) : null}
                </Pressable>
            </View>

            {filtersOpen ? (
                <FilterBar
                    activeFilter={view === 'covered' ? null : activeFilter}
                    setActiveFilter={setActiveFilter}
                    searchRadius={searchRadius}
                    setSearchRadius={setSearchRadius}
                    typeNote={view === 'covered' ? 'Covered shows parkades only. Pick a type to see the rest.' : null}
                />
            ) : null}

            <ViewChips view={view} onChange={onViewChange} />

            {topPick ? (
                <>
                    <View style={styles.sectionHead}>
                        <Text style={styles.sectionTitle} accessibilityRole="header">
                            A good place to start
                        </Text>
                        {isUpdating ? <Text style={styles.sectionNote}>Updating…</Text> : null}
                    </View>
                    <TopPick spot={topPick} view={view} onView={onViewSpot} />
                    {moreCount > 0 ? (
                        <Text style={styles.moreLabel}>
                            {moreCount === 1 ? '1 more nearby' : `${moreCount} more nearby`}
                        </Text>
                    ) : null}
                </>
            ) : null}
        </View>
    );
};

export default Header;
