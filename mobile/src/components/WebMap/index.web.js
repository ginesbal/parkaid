// WebMap — a real map for the web build: MapLibre GL JS drawing OpenFreeMap's
// OpenStreetMap tiles (free, no key). The phones use Google Maps through
// react-native-maps. React content is drawn into MapLibre markers through
// portals, so the web pins are the same components as the phones' pins.
// MapLibre credits OpenStreetMap on the map itself; keep it in view.

import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { StyleSheet, View } from 'react-native';
import { TOKENS } from '../../constants/theme';

// Light and quiet, so the pins carry the colour.
const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
const METERS_PER_DEG = 111320;

const toLngLat = ({ latitude, longitude }) => [longitude, latitude];

// A circle of `radius` metres around `center`, as GeoJSON.
function circleShape(center, radius, steps = 72) {
    const dLat = radius / METERS_PER_DEG;
    const dLng = radius / (METERS_PER_DEG * Math.cos((center.latitude * Math.PI) / 180));
    const ring = Array.from({ length: steps + 1 }, (_, i) => {
        const a = (i / steps) * 2 * Math.PI;
        return [center.longitude + dLng * Math.cos(a), center.latitude + dLat * Math.sin(a)];
    });
    return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: {} };
}

// The square around `center` that holds a circle of `radius` metres.
export function boundsAround(center, radius) {
    const dLat = radius / METERS_PER_DEG;
    const dLng = radius / (METERS_PER_DEG * Math.cos((center.latitude * Math.PI) / 180));
    return [[center.longitude - dLng, center.latitude - dLat], [center.longitude + dLng, center.latitude + dLat]];
}

const EMPTY = { type: 'FeatureCollection', features: [] };

/**
 * center:      { latitude, longitude } it opens on
 * zoom:        the zoom it opens at
 * interactive: false for a still map (Details, Home's suggestion)
 * markers:     [{ id, coordinate, node, anchor, offset, zIndex }]; `node` is
 *              React content, drawn at `coordinate`
 * area:        { center, radius }: the search circle, or null
 * credit:      where MapLibre's OpenStreetMap credit sits ('top-right', …),
 *              and creditInset, pixels to move it in from that edge.
 *              creditCollapsed starts it as its "i" button, for small maps
 *              it would cover; a tap opens it
 * onLoad:      the map is drawn and can be moved
 * onPress:     a tap on the map itself, not on a marker
 * onUserMove:  the driver moved the map, with its new centre
 * ref:         fitBounds(bounds, padding, animate), easeTo(coordinate, animate)
 */
const WebMap = forwardRef(function WebMap({
    center,
    zoom = 15,
    interactive = true,
    markers = [],
    area = null,
    credit = 'bottom-right',
    creditInset = 0,
    creditCollapsed = false,
    onLoad,
    onPress,
    onUserMove,
    style,
}, ref) {
    const container = useRef(null);
    const [map, setMap] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const handlers = useRef({ onLoad, onPress, onUserMove });
    handlers.current = { onLoad, onPress, onUserMove };

    useEffect(() => {
        const instance = new maplibregl.Map({
            container: container.current,
            style: STYLE_URL,
            center: toLngLat(center),
            zoom,
            interactive,
            attributionControl: false,
            dragRotate: false,
            pitchWithRotate: false,
            touchPitch: false,
        });
        instance.addControl(new maplibregl.AttributionControl({ compact: true }), credit);
        if (interactive) instance.touchZoomRotate.disableRotation();
        if (creditCollapsed) {
            // MapLibre opens the credit once the tiles' attribution arrives,
            // which can be after 'load'. Close it once everything is drawn,
            // as MapLibre itself does when the map is dragged.
            const collapse = () => {
                const attribution = instance.getContainer().querySelector('.maplibregl-ctrl-attrib.maplibregl-compact');
                if (!attribution) return;
                attribution.classList.remove('maplibregl-compact-show');
                instance.off('idle', collapse);
            };
            instance.on('idle', collapse);
        }

        instance.on('load', () => {
            instance.addSource('area', { type: 'geojson', data: EMPTY });
            instance.addLayer({ id: 'area-fill', type: 'fill', source: 'area', paint: { 'fill-color': TOKENS.primary, 'fill-opacity': 0.06 } });
            instance.addLayer({ id: 'area-line', type: 'line', source: 'area', paint: { 'line-color': TOKENS.primary, 'line-opacity': 0.3, 'line-width': 1.5 } });
            setLoaded(true);
            handlers.current.onLoad?.();
        });
        instance.on('click', (event) => {
            // A marker's own press handles taps on it.
            if (event.originalEvent?.target?.closest?.('.maplibregl-marker')) return;
            handlers.current.onPress?.();
        });
        instance.on('moveend', (event) => {
            // Only the driver's moves: ours (fitBounds, easeTo) have no originalEvent.
            if (!event.originalEvent) return;
            const { lat, lng } = instance.getCenter();
            handlers.current.onUserMove?.({ latitude: lat, longitude: lng });
        });
        setMap(instance);
        return () => instance.remove();
        // Made once; later changes go through the effects below.
    }, []);

    // Move the credit in from its edge, clear of what sits over the map.
    useEffect(() => {
        const corner = map?.getContainer().querySelector(`.maplibregl-ctrl-${credit}`);
        if (!corner) return;
        const edge = credit.startsWith('top') ? 'top' : 'bottom';
        corner.style[edge] = `${creditInset}px`;
    }, [map, credit, creditInset]);

    const areaLat = area?.center?.latitude;
    const areaLng = area?.center?.longitude;
    const areaRadius = area?.radius;
    useEffect(() => {
        if (!loaded) return;
        const shape = Number.isFinite(areaLat) && Number.isFinite(areaLng) && areaRadius
            ? circleShape({ latitude: areaLat, longitude: areaLng }, areaRadius)
            : EMPTY;
        map.getSource('area')?.setData(shape);
    }, [map, loaded, areaLat, areaLng, areaRadius]);

    // One element per marker, made on first use; React draws into it.
    const placed = useRef(new Map());
    const elementFor = (id) => {
        let entry = placed.current.get(id);
        if (!entry) {
            entry = { element: document.createElement('div'), marker: null };
            placed.current.set(id, entry);
        }
        return entry.element;
    };

    useEffect(() => {
        if (!map) return;
        const wanted = new Set();
        markers.forEach(({ id, coordinate, anchor = 'center', offset = [0, 0], zIndex = 1 }) => {
            wanted.add(id);
            const entry = placed.current.get(id);
            if (!entry) return;
            entry.element.style.zIndex = String(zIndex);
            if (!entry.marker) {
                entry.marker = new maplibregl.Marker({ element: entry.element, anchor, offset })
                    .setLngLat(toLngLat(coordinate))
                    .addTo(map);
            } else {
                entry.marker.setLngLat(toLngLat(coordinate));
            }
        });
        placed.current.forEach((entry, id) => {
            if (wanted.has(id)) return;
            entry.marker?.remove();
            placed.current.delete(id);
        });
    });

    useImperativeHandle(ref, () => ({
        fitBounds(bounds, padding, animate = true) {
            map?.fitBounds(bounds, { padding, maxZoom: 17, duration: animate ? 600 : 0 });
        },
        easeTo(coordinate, animate = true) {
            map?.easeTo({ center: toLngLat(coordinate), duration: animate ? 450 : 0 });
        },
    }), [map]);

    return (
        <View style={[styles.frame, style]}>
            {/* MapLibre styles its container; an inner View keeps the frame's own layout */}
            <View ref={container} style={styles.map} />
            {markers.map(({ id, node }) => createPortal(node, elementFor(id), String(id)))}
        </View>
    );
});

export default WebMap;

const styles = StyleSheet.create({
    frame: {
        overflow: 'hidden',
        backgroundColor: TOKENS.mapLand,
    },
    map: {
        width: '100%',
        height: '100%',
    },
});
