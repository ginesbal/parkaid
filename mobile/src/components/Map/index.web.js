import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import {
    createContext,
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import { View } from 'react-native';

// The web build's map: MapLibre drawing OpenFreeMap's tiles (free, no key or
// sign-up), behind the slice of the react-native-maps API the app uses:
// MapView with its camera methods, Marker, and Circle. Phone-only props
// (provider, tracksViewChanges, showsUserLocation…) are accepted and ignored.

// A light, low-contrast basemap, so the parking dots and the ring stand out.
// EXPO_PUBLIC_MAP_STYLE_URL can point at a self-hosted copy instead.
const STYLE_URL = process.env.EXPO_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/positron';
const TILE_SIZE = 512;
const MIN_ZOOM = 3;
const MAX_ZOOM = 19;
const METERS_PER_DEGREE_LAT = 111320;
const FILL = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 };

export const PROVIDER_GOOGLE = 'google';

const MapContext = createContext(null);

const toLngLat = ({ latitude, longitude }) => [longitude, latitude];

// OpenFreeMap's highway-shield layers compare each road's ref_length to 6, but
// most roads have no route number, so MapLibre logs a warning per tile and
// skips them. Treat a missing number as too long for a shield: the same roads
// are skipped, without the warnings.
function withQuietShields(style) {
    const fix = (expr) => {
        if (!Array.isArray(expr)) return expr;
        if (expr.length === 2 && expr[0] === 'get' && expr[1] === 'ref_length') {
            return ['coalesce', expr, 99];
        }
        return expr.map(fix);
    };
    return {
        ...style,
        layers: style.layers.map((layer) => (layer.filter ? { ...layer, filter: fix(layer.filter) } : layer)),
    };
}

// A self-hosted style may give its tiles, sprite and fonts as relative
// paths; MapLibre needs full URLs, so resolve them against the style's own
// address. Plain joining keeps the {z}/{x}/{y} and {fontstack} placeholders
// intact, where URL() would escape them.
function withFullUrls(style, styleUrl) {
    const resolve = (url) => {
        if (typeof url !== 'string' || /^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
        if (url.startsWith('/')) return new URL(styleUrl).origin + url;
        return styleUrl.slice(0, styleUrl.lastIndexOf('/') + 1) + url;
    };
    // Only rewrite what's there: a source with `tiles: undefined` breaks MapLibre.
    const sources = Object.fromEntries(Object.entries(style.sources || {}).map(([id, source]) => {
        const next = { ...source };
        if (source.url) next.url = resolve(source.url);
        if (source.tiles) next.tiles = source.tiles.map(resolve);
        return [id, next];
    }));
    const next = { ...style, sources };
    if (style.glyphs) next.glyphs = resolve(style.glyphs);
    if (Array.isArray(style.sprite)) next.sprite = style.sprite.map((entry) => ({ ...entry, url: resolve(entry.url) }));
    else if (style.sprite) next.sprite = resolve(style.sprite);
    return next;
}

function prepareStyle(previousStyle, style) {
    return withQuietShields(withFullUrls(style, new URL(STYLE_URL, window.location.href).href));
}

// react-native-maps describes the view as a center plus a span in degrees.
function regionOf(map) {
    const center = map.getCenter();
    const bounds = map.getBounds();
    return {
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: bounds.getNorth() - bounds.getSouth(),
        longitudeDelta: bounds.getEast() - bounds.getWest(),
    };
}

// The zoom at which a region's longitude span fills a map `width` px wide.
function zoomForRegion(width, region, fallback) {
    if (!region?.longitudeDelta) return fallback;
    const zoom = Math.log2((360 * (width || 360)) / (TILE_SIZE * region.longitudeDelta));
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

const MapView = forwardRef(function MapView({
    style,
    initialRegion,
    mapPadding,
    children,
    onMapReady,
    onRegionChange,
    onRegionChangeComplete,
    onPanDrag,
    onPress,
    onLongPress,
}, ref) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    // Set once the style has loaded: markers and shapes need it.
    const [readyMap, setReadyMap] = useState(null);

    // The map's listeners are attached once and read the latest handlers.
    const handlersRef = useRef({});
    handlersRef.current = { onMapReady, onRegionChange, onRegionChangeComplete, onPanDrag, onPress, onLongPress };

    useEffect(() => {
        const container = containerRef.current;
        // A tab can mount while still hidden, at zero width; the window is a
        // better guess then.
        const width = container.clientWidth || window.innerWidth;
        // Like react-native-maps, only the first initialRegion counts.
        const map = new maplibregl.Map({
            container,
            center: initialRegion ? toLngLat(initialRegion) : [0, 0],
            zoom: zoomForRegion(width, initialRegion, 2),
            // Added below, bottom-left: the right side has the map buttons.
            attributionControl: false,
            // North stays up, as on the phone app.
            dragRotate: false,
            pitchWithRotate: false,
            touchPitch: false,
        });
        map.touchZoomRotate.disableRotation();
        map.setStyle(STYLE_URL, { transformStyle: prepareStyle });
        // The map credits (OpenStreetMap's license requires them): the full
        // line on wide screens, an ⓘ button on phones. MapLibre opens the ⓘ as
        // soon as the credits arrive, over the map buttons, so close it right
        // after (this listener runs after the control's own); a tap on ⓘ still
        // shows them. It only opens once, so this stops after closing it.
        const compactCredits = width <= 640;
        map.addControl(new maplibregl.AttributionControl({ compact: compactCredits }), 'bottom-left');
        if (compactCredits) {
            const closeCredits = () => {
                const credits = container.querySelector('.maplibregl-ctrl-attrib.maplibregl-compact');
                if (!credits) return;
                credits.classList.remove('maplibregl-compact-show');
                credits.removeAttribute('open');
                map.off('sourcedata', closeCredits);
            };
            map.on('sourcedata', closeCredits);
        }
        mapRef.current = map;

        const handlers = handlersRef;
        const tapAt = (event) => ({
            nativeEvent: { coordinate: { latitude: event.lngLat.lat, longitude: event.lngLat.lng } },
        });
        // Ready once the style is in: markers and shapes need nothing more.
        // Not 'load', which waits for every tile, so one slow or failed tile
        // would keep the spots off the map.
        map.once('style.load', () => {
            setReadyMap(map);
            handlers.current.onMapReady?.();
        });
        map.on('move', () => handlers.current.onRegionChange?.(regionOf(map)));
        map.on('moveend', () => handlers.current.onRegionChangeComplete?.(regionOf(map)));
        map.on('drag', () => handlers.current.onPanDrag?.());
        map.on('click', (event) => handlers.current.onPress?.(tapAt(event)));
        // Right-click, or a long press where the browser reports one.
        map.on('contextmenu', (event) => handlers.current.onLongPress?.(tapAt(event)));

        return () => {
            mapRef.current = null;
            map.remove();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // mapPadding keeps the map's center (and so the drop-pin reticle's target)
    // in the band between the header and the bottom sheet.
    const { top = 0, right = 0, bottom = 0, left = 0 } = mapPadding || {};
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        map.setPadding({ top, right, bottom, left });
        // Like Google's logo on the phone, the map credits move in with the
        // padding, so the header and sheet never cover them.
        const container = map.getContainer();
        container.querySelectorAll('.maplibregl-ctrl-top-left, .maplibregl-ctrl-top-right')
            .forEach((corner) => { corner.style.top = `${top}px`; });
        container.querySelectorAll('.maplibregl-ctrl-bottom-left, .maplibregl-ctrl-bottom-right')
            .forEach((corner) => { corner.style.bottom = `${bottom}px`; });
    }, [top, right, bottom, left]);

    useImperativeHandle(ref, () => ({
        animateCamera(camera, { duration = 500 } = {}) {
            const map = mapRef.current;
            if (!map || !camera) return;
            const options = { duration };
            if (camera.center) options.center = toLngLat(camera.center);
            if (typeof camera.zoom === 'number') options.zoom = camera.zoom;
            if (typeof camera.heading === 'number') options.bearing = camera.heading;
            map.easeTo(options);
        },
        animateToRegion(region, duration = 500) {
            const map = mapRef.current;
            if (!map || !region) return;
            map.easeTo({
                center: toLngLat(region),
                zoom: zoomForRegion(map.getContainer().clientWidth, region, map.getZoom()),
                duration,
            });
        },
        async getCamera() {
            const map = mapRef.current;
            const center = map.getCenter();
            return {
                center: { latitude: center.lat, longitude: center.lng },
                zoom: map.getZoom(),
                heading: map.getBearing(),
                pitch: map.getPitch(),
                altitude: 0,
            };
        },
        // Pixels from the map's top-left corner, as on the phone.
        async pointForCoordinate(coordinate) {
            const point = mapRef.current.project(toLngLat(coordinate));
            return { x: point.x, y: point.y };
        },
    }), []);

    return (
        <View style={style}>
            <div ref={containerRef} style={FILL} />
            {readyMap && <MapContext.Provider value={readyMap}>{children}</MapContext.Provider>}
        </View>
    );
});

export default MapView;

// react-native-maps anchors are fractions of the marker; MapLibre names them.
const ANCHOR_NAMES = {
    '0.5,0.5': 'center',
    '0.5,1': 'bottom',
    '0.5,0': 'top',
    '0,0.5': 'left',
    '1,0.5': 'right',
};

/**
 * A marker whose look is its React children, drawn in a DOM element MapLibre
 * keeps in place over the map. Anchored at its bottom center by default, as
 * in react-native-maps.
 */
export function Marker({ coordinate, anchor, onPress, children }) {
    const map = useContext(MapContext);
    const [element] = useState(() => document.createElement('div'));
    const markerRef = useRef(null);
    const latest = useRef({ coordinate, onPress });
    latest.current = { coordinate, onPress };
    const anchorName = ANCHOR_NAMES[`${anchor?.x ?? 0.5},${anchor?.y ?? 1}`] || 'center';

    useEffect(() => {
        const handleClick = (event) => {
            // The marker's tap, not the map's: keep it from reaching the map,
            // which would treat it as a tap on empty space.
            event.stopPropagation();
            latest.current.onPress?.({ nativeEvent: { coordinate: latest.current.coordinate } });
        };
        element.addEventListener('click', handleClick);
        const marker = new maplibregl.Marker({ element, anchor: anchorName })
            .setLngLat(toLngLat(latest.current.coordinate))
            .addTo(map);
        markerRef.current = marker;
        return () => {
            element.removeEventListener('click', handleClick);
            marker.remove();
        };
    }, [map, element, anchorName]);

    useEffect(() => {
        markerRef.current?.setLngLat(toLngLat(coordinate));
    }, [coordinate.latitude, coordinate.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        element.style.cursor = onPress ? 'pointer' : '';
    }, [element, onPress]);

    return createPortal(children, element);
}

// A circle `radius` meters around `center`, as a 64-sided polygon.
function circlePolygon({ latitude, longitude }, radius) {
    const dLat = radius / METERS_PER_DEGREE_LAT;
    const dLng = dLat / Math.cos((latitude * Math.PI) / 180);
    const ring = [];
    for (let i = 0; i <= 64; i += 1) {
        const angle = (i / 64) * 2 * Math.PI;
        ring.push([longitude + dLng * Math.cos(angle), latitude + dLat * Math.sin(angle)]);
    }
    return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
}

let circleCount = 0;

/** A filled, outlined circle drawn into the map, under its street labels. */
export function Circle({ center, radius, fillColor, strokeColor, strokeWidth = 1 }) {
    const map = useContext(MapContext);
    const [id] = useState(() => `circle-${(circleCount += 1)}`);

    useEffect(() => {
        // Below the first label layer, so street names stay readable on top.
        const labels = map.getStyle().layers.find((layer) => layer.type === 'symbol')?.id;
        map.addSource(id, { type: 'geojson', data: circlePolygon(center, radius) });
        map.addLayer({ id: `${id}-fill`, type: 'fill', source: id, paint: { 'fill-color': fillColor } }, labels);
        map.addLayer({
            id: `${id}-line`,
            type: 'line',
            source: id,
            paint: { 'line-color': strokeColor, 'line-width': strokeWidth },
        }, labels);
        return () => {
            // The whole map may already be gone (screen closing).
            try {
                map.removeLayer(`${id}-line`);
                map.removeLayer(`${id}-fill`);
                map.removeSource(id);
            } catch {
                // nothing left to remove
            }
        };
    }, [map, id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        map.getSource(id)?.setData(circlePolygon(center, radius));
    }, [map, id, center.latitude, center.longitude, radius]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!map.getLayer(`${id}-fill`)) return;
        map.setPaintProperty(`${id}-fill`, 'fill-color', fillColor);
        map.setPaintProperty(`${id}-line`, 'line-color', strokeColor);
        map.setPaintProperty(`${id}-line`, 'line-width', strokeWidth);
    }, [map, id, fillColor, strokeColor, strokeWidth]);

    return null;
}
