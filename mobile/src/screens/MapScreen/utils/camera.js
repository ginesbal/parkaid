export const centerCamera = async (mapRef, region, latitude, longitude, duration = 140) => {
    if (!mapRef?.current) return;
    try {
        const cam = await mapRef.current.getCamera();
        mapRef.current.animateCamera(
            { ...cam, center: { latitude, longitude } },
            { duration }
        );
    } catch {
        mapRef.current.animateToRegion(
            { ...region, latitude, longitude },
            duration
        );
    }
};
