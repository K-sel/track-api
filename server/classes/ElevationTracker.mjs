/**
 * ElevationTracker - Manages elevation data tracking
 * Handles elevation gain, loss, and altitude min/max calculations
 */
export default class ElevationTracker {
  #previousElevation = null;
  #totalElevationGain = 0;
  #totalElevationLoss = 0;
  #maxAltitude = 0;
  #minAltitude = 0;

  static ELEVATION_THRESHOLD = 0;

  /**
   * Process elevation data from a GPS point
   * @param {number} currentElevation - Current elevation in meters
   * @param {boolean} isStart - Whether this is the start of tracking
   * @param {boolean} isStop - Whether this is the end of tracking
   */
  processElevation(currentElevation, isStart = false, isStop = false) {
    if (!currentElevation || isNaN(currentElevation)) return;

    if (isStart) {
      this.#previousElevation = currentElevation;
      this.#totalElevationGain = 0;
      this.#totalElevationLoss = 0;
      this.#maxAltitude = currentElevation;
      this.#minAltitude = currentElevation;
      console.log(`Tracking started at altitude: ${currentElevation}m`);
      return;
    }

    if (isStop) {
      console.log(
        `Tracking stopped. Total gain: ${this.#totalElevationGain.toFixed(
          2
        )}m, Total loss: ${this.#totalElevationLoss.toFixed(2)}m`
      );
      this.#previousElevation = null;
      return;
    }

    if (this.#previousElevation !== null) {
      const elevationChange = currentElevation - this.#previousElevation;

      // Update max altitude
      if (
        currentElevation >
        this.#maxAltitude + ElevationTracker.ELEVATION_THRESHOLD
      ) {
        this.#maxAltitude = currentElevation;
        console.log(`New maximum altitude: ${this.#maxAltitude.toFixed(2)}m`);
      }

      // Update min altitude
      if (
        currentElevation <
        this.#minAltitude - ElevationTracker.ELEVATION_THRESHOLD
      ) {
        this.#minAltitude = currentElevation;
        console.log(`New minimum altitude: ${this.#minAltitude.toFixed(2)}m`);
      }

      // Track elevation gain
      if (elevationChange > ElevationTracker.ELEVATION_THRESHOLD) {
        this.#totalElevationGain += elevationChange;
        console.log(
          `Elevation gain: +${elevationChange.toFixed(
            2
          )}m (Total: ${this.#totalElevationGain.toFixed(2)}m)`
        );
      }
      // Track elevation loss
      else if (elevationChange < -ElevationTracker.ELEVATION_THRESHOLD) {
        this.#totalElevationLoss += Math.abs(elevationChange);
        console.log(
          `Elevation loss: ${elevationChange.toFixed(
            2
          )}m (Total: ${this.#totalElevationLoss.toFixed(2)}m)`
        );
      }
    }

    this.#previousElevation = currentElevation;
  }

  /**
   * Get current elevation statistics
   * @returns {Object} Elevation data
   */
  getElevationData() {
    return {
      elevationGain: this.#totalElevationGain,
      elevationLoss: this.#totalElevationLoss,
      altitude_max: this.#maxAltitude,
      altitude_min: this.#minAltitude,
    };
  }

  /**
   * Reset all elevation tracking data
   */
  reset() {
    this.#previousElevation = null;
    this.#totalElevationGain = 0;
    this.#totalElevationLoss = 0;
    this.#maxAltitude = 0;
    this.#minAltitude = 0;
  }
}
