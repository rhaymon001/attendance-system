/**
 * haversineDistance
 * -----------------
 * Computes the great-circle distance in metres between two points
 * on the Earth's surface given their latitude and longitude in decimal degrees.
 *
 * Used by attendance.controller.js to check whether a student's
 * submitted GPS coordinates fall within a venue's geofence radius.
 *
 * Formula reference: https://en.wikipedia.org/wiki/Haversine_formula
 *
 * @param   {number} lat1 - Latitude of point 1  (student's position)
 * @param   {number} lng1 - Longitude of point 1 (student's position)
 * @param   {number} lat2 - Latitude of point 2  (venue's registered position)
 * @param   {number} lng2 - Longitude of point 2 (venue's registered position)
 * @returns {number}      - Distance in metres (float)
 *
 * Example:
 *   haversineDistance(11.1561, 7.6228, 11.1558, 7.6231) → ~38.4 metres
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  // Earth's mean radius in metres
  const R = 6371000;

  // Convert degrees to radians
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance in metres, rounded to 1 decimal place
  return Math.round(R * c * 10) / 10;
};

module.exports = haversineDistance;
