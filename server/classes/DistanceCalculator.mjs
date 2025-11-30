import { haversine } from "../../services/haversineFormula.mjs";

/**
 * DistanceCalculator - Manages distance calculations between GPS points
 * Accumulates total distance traveled during an activity
 */
export default class DistanceCalculator {
  #previousPoint = null;
  #totalDistance = 0;

  /**
   * Process a new GPS point and calculate distance from previous point
   * @param {Object} geoJsonPoint - GeoJSON point with coordinates
   * @returns {number|null} Distance from previous point in meters, or null if first point
   */
  addPoint(geoJsonPoint) {
    if (this.#previousPoint === null) {
      this.#previousPoint = geoJsonPoint;
      return null;
    }

    const distance = haversine(this.#previousPoint, geoJsonPoint);
    this.#totalDistance += distance;
    this.#previousPoint = geoJsonPoint;

    return distance;
  }

  /**
   * Get total distance traveled
   * @returns {number} Total distance in meters
   */
  getTotalDistance() {
    return this.#totalDistance;
  }

  /**
   * Reset distance tracking
   */
  reset() {
    this.#previousPoint = null;
    this.#totalDistance = 0;
  }
}
