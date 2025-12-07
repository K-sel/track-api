/**
 * LapTracker - Manages lap/segment tracking during an activity
 * Tracks individual laps with their metrics (distance, duration, pace, elevation)
 * Allows for detailed performance analysis per lap
 */
export default class LapTracker {
  #laps = [];
  #currentLap = null;
  #lapStartTimestamp = null;
  #lapStartDistance = 0;
  #lapStartElevation = 0;
  #lapStartElevationGain = 0;

  /**
   * Start a new lap
   * @param {number} timestamp - Lap start timestamp
   * @param {number} currentDistance - Total distance at lap start (meters)
   * @param {number} currentElevation - Current elevation (meters)
   * @param {number} currentElevationGain - Total elevation gain at lap start (meters)
   */
  startLap(timestamp, currentDistance = 0, currentElevation = 0, currentElevationGain = 0) {
    // If there's a current lap, finish it first
    if (this.#currentLap) {
      this.endLap(timestamp, currentDistance, currentElevation, currentElevationGain);
    }

    this.#lapStartTimestamp = timestamp;
    this.#lapStartDistance = currentDistance;
    this.#lapStartElevation = currentElevation;
    this.#lapStartElevationGain = currentElevationGain;

    this.#currentLap = {
      lapNumber: this.#laps.length + 1,
      startTimestamp: timestamp,
      startDistance: currentDistance,
      startElevation: currentElevation,
    };
  }

  /**
   * End the current lap and calculate its metrics
   * @param {number} timestamp - Lap end timestamp
   * @param {number} currentDistance - Total distance at lap end (meters)
   * @param {number} currentElevation - Current elevation (meters)
   * @param {number} currentElevationGain - Total elevation gain at lap end (meters)
   * @returns {Object|null} Completed lap data or null if no lap was active
   */
  endLap(timestamp, currentDistance, currentElevation, currentElevationGain) {
    if (!this.#currentLap || !this.#lapStartTimestamp) {
      return null;
    }

    const duration = timestamp - this.#lapStartTimestamp;
    const distance = currentDistance - this.#lapStartDistance;
    const elevationGain = currentElevationGain - this.#lapStartElevationGain;
    const elevationChange = currentElevation - this.#lapStartElevation;

    // Calculate lap metrics
    const avgSpeed = duration > 0 ? (distance / 1000) / (duration / 3600000) : 0; // km/h
    const pace = distance > 0 ? duration / (distance / 1000) : 0; // ms per km

    const completedLap = {
      ...this.#currentLap,
      endTimestamp: timestamp,
      endDistance: currentDistance,
      endElevation: currentElevation,
      duration,
      distance,
      elevationGain,
      elevationChange,
      avgSpeed,
      pace,
    };

    this.#laps.push(completedLap);
    this.#currentLap = null;
    this.#lapStartTimestamp = null;

    return completedLap;
  }

  /**
   * Get all completed laps
   * @returns {Array} Array of lap objects
   */
  getLaps() {
    return this.#laps;
  }

  /**
   * Get the current active lap
   * @returns {Object|null} Current lap or null if none active
   */
  getCurrentLap() {
    return this.#currentLap;
  }

  /**
   * Get total number of completed laps
   * @returns {number} Number of laps
   */
  getLapCount() {
    return this.#laps.length;
  }

  /**
   * Get statistics for a specific lap
   * @param {number} lapNumber - Lap number (1-indexed)
   * @returns {Object|null} Lap data or null if not found
   */
  getLap(lapNumber) {
    return this.#laps.find((lap) => lap.lapNumber === lapNumber) || null;
  }

  /**
   * Get fastest lap by pace
   * @returns {Object|null} Fastest lap or null if no laps
   */
  getFastestLap() {
    if (this.#laps.length === 0) return null;

    return this.#laps.reduce((fastest, current) => {
      return current.avgSpeed > fastest.avgSpeed ? current : fastest;
    });
  }

  /**
   * Get slowest lap by pace
   * @returns {Object|null} Slowest lap or null if no laps
   */
  getSlowestLap() {
    if (this.#laps.length === 0) return null;

    return this.#laps.reduce((slowest, current) => {
      return current.avgSpeed < slowest.avgSpeed ? current : slowest;
    });
  }

  /**
   * Get average lap metrics across all laps
   * @returns {Object} Average metrics
   */
  getAverageLapMetrics() {
    if (this.#laps.length === 0) {
      return {
        avgDistance: 0,
        avgDuration: 0,
        avgSpeed: 0,
        avgPace: 0,
        avgElevationGain: 0,
      };
    }

    const totals = this.#laps.reduce(
      (acc, lap) => ({
        distance: acc.distance + lap.distance,
        duration: acc.duration + lap.duration,
        speed: acc.speed + lap.avgSpeed,
        pace: acc.pace + lap.pace,
        elevationGain: acc.elevationGain + lap.elevationGain,
      }),
      { distance: 0, duration: 0, speed: 0, pace: 0, elevationGain: 0 }
    );

    const count = this.#laps.length;

    return {
      avgDistance: totals.distance / count,
      avgDuration: totals.duration / count,
      avgSpeed: totals.speed / count,
      avgPace: totals.pace / count,
      avgElevationGain: totals.elevationGain / count,
    };
  }

  /**
   * Get lap summary with all statistics
   * @returns {Object} Summary of all laps
   */
  getSummary() {
    return {
      totalLaps: this.#laps.length,
      laps: this.#laps,
      fastestLap: this.getFastestLap(),
      slowestLap: this.getSlowestLap(),
      averages: this.getAverageLapMetrics(),
      currentLap: this.#currentLap,
    };
  }

  /**
   * Reset all lap data
   */
  reset() {
    this.#laps = [];
    this.#currentLap = null;
    this.#lapStartTimestamp = null;
    this.#lapStartDistance = 0;
    this.#lapStartElevation = 0;
    this.#lapStartElevationGain = 0;
  }
}