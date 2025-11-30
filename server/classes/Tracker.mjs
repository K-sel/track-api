import activityService from "../services/activityService.mjs";
import ElevationTracker from "./ElevationTracker.mjs";
import DistanceCalculator from "./DistanceCalculator.mjs";
import ActivityMetrics from "./ActivityMetrics.mjs";
import GpsBuffer from "./GpsBuffer.mjs";

/**
 * Tracker - Main orchestrator for activity tracking
 * Coordinates multiple tracking components for a single activity instance
 * Each Tracker instance manages one user's activity session
 */
export default class Tracker {
  #activityId;
  #periodicSaveInterval = null;
  #SAVING_INTERVAL = 10000; // 10 seconds

  // Specialized components
  #elevationTracker;
  #distanceCalculator;
  #activityMetrics;
  #gpsBuffer;

  constructor(userId, activityId) {
    this.#activityId = activityId;

    // Initialize specialized components
    this.#elevationTracker = new ElevationTracker();
    this.#distanceCalculator = new DistanceCalculator();
    this.#activityMetrics = new ActivityMetrics();
    this.#gpsBuffer = new GpsBuffer(userId, activityId);
  }

  /**
   * Initialize GPS trace
   * @returns {Promise<string>} GPS trace ID
   */
  async initGpsTrace() {
    return await this.#gpsBuffer.initTrace();
  }

  /**
   * Process a GPS point update
   * @param {Object} geoJsonPoint - GeoJSON point with coordinates and timestamp
   * @param {Object} elevationData - Elevation data for the point
   * @param {boolean} isStart - Whether this is the start of the activity
   * @param {boolean} isStop - Whether this is the end of the activity
   */
  processGpsPoint(geoJsonPoint, elevationData, isStart = false, isStop = false) {
    // Add point to GPS buffer
    this.#gpsBuffer.addPoint(geoJsonPoint);

    // Track timestamps
    if (isStart) {
      this.#activityMetrics.setStartTimestamp(geoJsonPoint.timestamp);
    }
    if (isStop) {
      this.#activityMetrics.setEndTimestamp(geoJsonPoint.timestamp);
    }

    // Calculate distance
    this.#distanceCalculator.addPoint(geoJsonPoint);

    // Track elevation
    const currentElevation = parseFloat(elevationData?.height);
    this.#elevationTracker.processElevation(currentElevation, isStart, isStop);
  }

  /**
   * Start periodic data saving
   */
  startPeriodicSave() {
    if (!this.#activityId) return false;

    if (this.#periodicSaveInterval) return; // Avoid creating multiple intervals

    this.#periodicSaveInterval = setInterval(async () => {
      await this.#savePeriodicData();
    }, this.#SAVING_INTERVAL);

    console.log("Intervalle de sauvegarde périodique démarré");
    return true;
  }

  /**
   * Stop periodic data saving and perform final save
   */
  async stopPeriodicSave() {
    await this.#savePeriodicData();

    if (this.#periodicSaveInterval) {
      clearInterval(this.#periodicSaveInterval);
      this.#periodicSaveInterval = null;
      console.log("Intervalle de sauvegarde périodique arrêté");
    }
  }

  /**
   * Save all tracking data to database
   * @private
   */
  async #savePeriodicData() {
    if (!this.#activityId) return;

    try {
      // Prepare update data
      const elevationData = this.#elevationTracker.getElevationData();
      const distance = this.#distanceCalculator.getTotalDistance();
      const duration = this.#activityMetrics.calculateDuration();
      const avgSpeed = this.#activityMetrics.calculateAverageSpeed(distance);

      const updateData = {
        ...elevationData,
        distance: distance,
        duration: duration,
        avgSpeed: avgSpeed,
      };

      // Save GPS points to trace
      await this.#gpsBuffer.flush();

      // Update activity
      await activityService.updateActivity(this.#activityId, updateData);

      console.log(
        `Données sauvegardées pour l'activité ${this.#activityId}:`,
        updateData
      );
    } catch (error) {
      console.error("Erreur lors de la sauvegarde périodique:", error);
    }
  }

  /**
   * Update activity start position
   * @param {Object} geoJsonPoint - Start position
   */
  async updateStartPosition(geoJsonPoint) {
    try {
      await activityService.updateActivity(this.#activityId, {
        startPosition: geoJsonPoint,
      });
    } catch (error) {
      console.error("Error updating start position:", error);
      throw error;
    }
  }

  /**
   * Update activity end position
   * @param {Object} geoJsonPoint - End position
   */
  async updateEndPosition(geoJsonPoint) {
    try {
      await activityService.updateActivity(this.#activityId, {
        endPosition: geoJsonPoint,
      });
    } catch (error) {
      console.error("Error updating end position:", error);
      throw error;
    }
  }

  /**
   * Finalize GPS trace and save final data
   * @param {string} state - Final state ("finished", "stopped", etc.)
   */
  async finalizeGpsTrace(state = "finished") {
    try {
      // Final save of all data
      await this.#savePeriodicData();

      // Finalize GPS trace
      await this.#gpsBuffer.finalizeTrace(state);
    } catch (error) {
      console.error("Erreur lors de la finalisation:", error);
      throw error;
    }
  }

  /**
   * Get current tracking statistics
   * @returns {Object} Current stats
   */
  getStats() {
    return {
      elevation: this.#elevationTracker.getElevationData(),
      distance: this.#distanceCalculator.getTotalDistance(),
      duration: this.#activityMetrics.calculateDuration(),
      avgSpeed: this.#activityMetrics.calculateAverageSpeed(
        this.#distanceCalculator.getTotalDistance()
      ),
      gpsPointsBuffered: this.#gpsBuffer.getBufferSize(),
    };
  }

  /**
   * Reset all tracking data
   */
  reset() {
    this.#elevationTracker.reset();
    this.#distanceCalculator.reset();
    this.#activityMetrics.reset();
    this.#gpsBuffer.clearBuffer();
  }
}
