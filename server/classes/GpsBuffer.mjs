import { gpsTraceService } from "../services/gpsTraceService.mjs";

/**
 * GpsBuffer - Manages GPS point buffering and trace persistence
 * Buffers GPS points in memory and persists them to the database
 */
export default class GpsBuffer {
  #gpsPointsBuffer = [];
  #gpsTraceId = null;
  #activityId;
  #userId;

  constructor(userId, activityId) {
    this.#userId = userId;
    this.#activityId = activityId;
  }

  /**
   * Initialize GPS trace in database
   * @returns {Promise<string>} GPS trace ID
   */
  async initTrace() {
    try {
      this.#gpsTraceId = await gpsTraceService.createBlankTrace(
        this.#activityId,
        this.#userId
      );
      console.log(`GPS trace initialized: ${this.#gpsTraceId}`);
      return this.#gpsTraceId;
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la trace GPS:", error);
      throw error;
    }
  }

  /**
   * Add a GPS point to the buffer
   * @param {Object} geoJsonPoint - GeoJSON point to buffer
   */
  addPoint(geoJsonPoint) {
    this.#gpsPointsBuffer.push(geoJsonPoint);
    console.log("New geoJsonPoint pushed to buffer:", geoJsonPoint);
  }

  /**
   * Get buffered GPS points
   * @returns {Array} Buffered GPS points
   */
  getBufferedPoints() {
    return [...this.#gpsPointsBuffer];
  }

  /**
   * Get number of buffered points
   * @returns {number} Buffer size
   */
  getBufferSize() {
    return this.#gpsPointsBuffer.length;
  }

  /**
   * Save buffered GPS points to database and clear buffer
   * @returns {Promise<boolean>} True if points were saved, false if buffer was empty
   */
  async flush() {
    if (this.#gpsPointsBuffer.length === 0) {
      return false;
    }

    if (!this.#gpsTraceId) {
      console.warn("No GPS trace initialized, cannot flush buffer");
      return false;
    }

    try {
      await gpsTraceService.updateTrace(
        this.#gpsTraceId,
        this.#gpsPointsBuffer
      );
      console.log(
        `Flushed ${this.#gpsPointsBuffer.length} GPS points to trace ${
          this.#gpsTraceId
        }`
      );
      this.#gpsPointsBuffer = [];
      return true;
    } catch (error) {
      console.error("Error flushing GPS buffer:", error);
      throw error;
    }
  }

  /**
   * Finalize GPS trace (encode polyline, change state)
   * @param {string} state - Final state of the trace (e.g., "finished", "stopped")
   * @returns {Promise<void>}
   */
  async finalizeTrace(state = "finished") {
    if (!this.#gpsTraceId) {
      console.warn("Aucune trace GPS à finaliser");
      return;
    }

    try {
      // Save any remaining GPS points before finalizing
      await this.flush();

      // Finalize the trace (encode polyline, clear buffer, change state)
      await gpsTraceService.finalizeTrace(this.#gpsTraceId, state);
      console.log(`Trace GPS finalisée: ${this.#gpsTraceId} (${state})`);
    } catch (error) {
      console.error("Erreur lors de la finalisation de la trace GPS:", error);
      throw error;
    }
  }

  /**
   * Clear buffer without saving
   */
  clearBuffer() {
    this.#gpsPointsBuffer = [];
  }

  /**
   * Get GPS trace ID
   * @returns {string|null} GPS trace ID
   */
  getTraceId() {
    return this.#gpsTraceId;
  }
}
