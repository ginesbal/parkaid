import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import BrandPin from '../../../../components/BrandPin';
import { TOKENS } from '../../../../constants/theme';
import { getTypeNote } from '../../../../utils/filters';
import TopPick from '../TopPick';
import FilterBar from './FilterBar';
import ViewChips from './ViewChips';
import { styles } from './styles';

/**
 * Home header: greeting, search, view chips, optional filters, and the top pick.
 * Everything above the list rows. `statusMessage` says where the list is
 * measured from when it is not the phone's location now, with an optional
 * `statusAction` ({ label, onPress }); `fromDowntown` when that is downtown.
 * `savedNote` says how old the list is (utils/loadStatus).
 */
const Header = ({
    greeting,
    statusMessage,
    statusAction = null,
    fromDowntown = false,
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
    savedNote,
    now,
}) => {
    const filterLabel = filterCount > 0 ? `Filters, ${filterCount} active` : 'Filters';
    const typeNote = getTypeNote(activeFilter);

    return (
        <View style={styles.header}>
            <View style={styles.greetingRow}>
                <Text style={styles.greeting} accessibilityRole="header">
                    {greeting.hello}{'\n'}{greeting.ask}
                </Text>
                <BrandPin size={36} style={styles.greetingPin} />
            </View>

            {statusMessage ? (
                <View style={[styles.statusBanner, styles.statusBannerInfo]} accessibilityRole="alert">
                    <MaterialCommunityIcons name="crosshairs-question" size={16} color={TOKENS.primary} />
                    <Text style={styles.statusBannerText}>
                        {statusMessage}
                        {statusAction ? (
                            <>
                                {' '}
                                <Text style={styles.statusAction} onPress={statusAction.onPress} accessibilityRole="button">
                                    {statusAction.label}
                                </Text>
                            </>
                        ) : null}
                    </Text>
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
                    activeFilter={activeFilter}
                    setActiveFilter={setActiveFilter}
                    searchRadius={searchRadius}
                    setSearchRadius={setSearchRadius}
                />
            ) : null}

            <ViewChips view={view} onChange={onViewChange} />

            {/* A list narrowed to one type says so, with the way back to all */}
            {typeNote ? (
                <View style={styles.typeNoteRow}>
                    <Text style={styles.typeNote}>{typeNote}</Text>
                    <Pressable
                        onPress={() => setActiveFilter('all')}
                        style={({ pressed }) => [styles.typeNoteAction, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityHint="Shows every type of parking"
                    >
                        <Text style={styles.typeNoteActionText}>Show all</Text>
                    </Pressable>
                </View>
            ) : null}

            {topPick ? (
                <>
                    <View style={styles.sectionHead}>
                        <Text style={styles.sectionTitle} accessibilityRole="header">
                            A good spot to start
                        </Text>
                        {savedNote ? <Text style={styles.sectionNote}>{savedNote}</Text> : null}
                    </View>
                    <TopPick spot={topPick} view={view} onView={onViewSpot} fromDowntown={fromDowntown} now={now} />
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
