// How a parking_spots row becomes a spot in /api/parking/nearby. Kept apart
// from the route so the shape can be tested without a database.

// Calgary price-zone -> $/hour. The mobile app reads both `price` and
// `price_per_hour`, so /nearby returns both from this one source.
const PRICE_BY_ZONE = { '1': 1.0, '2': 2.0, '3': 3.0, '4': 4.0, '5': 5.0, '6': 6.0 };
const priceForZone = (zone) => (zone ? PRICE_BY_ZONE[zone] || 0 : 0);

// The City writes "none" for a block without a rush-hour restriction.
const restriction = (value) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text && text.toLowerCase() !== 'none' ? text : null;
};

function toSpot(spot) {
  return {
    id: spot.id,
    spot_type: spot.spot_type,
    address: spot.address_desc || 'Unknown Address',
    coordinates: spot.coordinates,
    distance: Math.round(spot.distance),
    walkingTime: Math.ceil(spot.distance / 80),

    capacity: spot.zone_cap || spot.seg_cap || 0,
    available: spot.zone_cap || spot.seg_cap || 0,

    zone_info: {
      permit_zone: spot.permit_zone,
      price_zone: spot.price_zone,
      html_zone_rate: spot.html_zone_rate,
      zone_type: spot.zone_type,
      parking_zone: spot.parking_zone,
      enforceable_time: spot.enforceable_time,
      // Rush-hour no-parking times on weekdays, as the City writes them
      // ("AM&PM", "07:00 - 08:30 , 15:30 - 18:00"); null when there are none.
      parking_restrict_type: restriction(spot.parking_restrict_type),
      parking_restrict_time: restriction(spot.parking_restrict_time),
    },

    metadata: {
      stall_type: spot.stall_type,
      camera: spot.camera,
      block_side: spot.block_side,
      max_time: spot.max_time,
      zone_cap: spot.zone_cap,
      seg_cap: spot.seg_cap,
      lot_name: spot.lot_name,
      lot_num: spot.lot_num,
      parking_type: spot.parking_type,
      home_page: spot.home_page,
      time_restriction: spot.time_restriction,
      parking_restriction: spot.parking_restriction,
      no_stopping: spot.no_stopping,
      description: spot.description,
      ctp_class: spot.ctp_class,
      dot: spot.dot,
      octant: spot.octant,
    },

    price: priceForZone(spot.price_zone),
    price_per_hour: priceForZone(spot.price_zone),

    max_duration_minutes: spot.max_time ? parseFloat(spot.max_time) : null,
  };
}

module.exports = { toSpot };
