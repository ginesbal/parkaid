// How a parking_spots row becomes a spot in /api/parking/nearby. Kept apart
// from the route so the shape can be tested without a database.

const { parseZoneRate, rateAt } = require('./zoneRates');

// Street zones the public can't park in: for taxis, valets, registered
// commercial vehicles and Access Calgary vans. /nearby leaves them out.
const NOT_PUBLIC_ZONES = ['Taxi Zone', 'Valet Parking Zone', 'Registered Loading Zone', 'Access Calgary Loading Zone'];

// The City writes "none" for a block without a rush-hour restriction.
const restriction = (value) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text && text.toLowerCase() !== 'none' ? text : null;
};

// `now`: when the request is answered, for `price_per_hour`.
function toSpot(spot, now = new Date()) {
  // The City's rates by time of day (utils/zoneRates); null when unknown.
  const rates = parseZoneRate(spot.html_zone_rate);
  const rateNow = rateAt(rates, now);
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

    // The rate periods are the source; these say the rate when asked, in
    // Calgary, and are null when no period covers that time.
    rates,
    price: rateNow,
    price_per_hour: rateNow,

    max_duration_minutes: spot.max_time ? parseFloat(spot.max_time) : null,
  };
}

module.exports = { toSpot, NOT_PUBLIC_ZONES };
