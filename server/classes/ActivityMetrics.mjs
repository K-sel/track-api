/**
 * ActivityMetrics - Manages time-based activity metrics
 * Calculates duration and average speed based on start/end positions
 */
export default class ActivityMetrics {
  #startTimestamp = null;
  #endTimestamp = null;

  /**
   * Set the start timestamp
   * @param {number} timestamp - Start timestamp in milliseconds
   */
  setStartTimestamp(timestamp) {
    this.#startTimestamp = timestamp;
  }

  /**
   * Set the end timestamp
   * @param {number} timestamp - End timestamp in milliseconds
   */
  setEndTimestamp(timestamp) {
    this.#endTimestamp = timestamp;
  }

  /**
   * Calculate duration between start and end timestamps
   * @returns {number} Duration in milliseconds
   */
  calculateDuration() {
    if (!this.#startTimestamp || !this.#endTimestamp) {
      return 0;
    }

    return Math.abs(this.#endTimestamp - this.#startTimestamp);
  }

  /**
   * Calculate average speed
   * @param {number} distance - Total distance in meters
   * @returns {number} Average speed in km/h
   */
  calculateAverageSpeed(distance) {
    const duration = this.calculateDuration();

    if (duration === 0) {
      return 0;
    }

    // Convert duration from milliseconds to hours
    const hours = duration / 3600000;

    // Convert distance from meters to kilometers and calculate speed
    const distanceKm = distance / 1000;
    return distanceKm / hours;
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.#startTimestamp = null;
    this.#endTimestamp = null;
  }
}
