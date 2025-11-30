import activityService from "../services/activityService.mjs";
import { gpsTraceService } from "../services/gpsTraceService.mjs";

export default class Tracker {
  #previousElevation = null;
  #totalElevationGain = 0;
  #totalElevationLoss = 0;
  #maxAltitude = 0;
  #minAltitude = 0;
  #currentElevation;
  #activityId;
  #userId;
  #gpsTraceId = null; // ID de la trace GPS
  #periodicSaveInterval = null; // Intervalle pour sauvegarder périodiquement
  #SAVING_INTERVAL = 60000; // 10000ms = 10 secondes
  #gpsPointsBuffer = []; // Buffer pour stocker les points GPS en mémoire

  static ELEVATION_THRESHOLD = 3;

  constructor(userId) {
    this.#userId = userId;
  }

  appendGpsBuffer = (geoJsonPoint) => {
    this.#gpsPointsBuffer.push(geoJsonPoint);
    console.log("New geoJsonPoint pushed to buffer : ", geoJsonPoint);
  };

  resetGpsBuffer = () => {
    this.#gpsPointsBuffer = [];
  };

  initActivity = async () => {
    try {
      this.#activityId = await activityService.createBlankActivity(this.#userId);

      // Create GPS trace
      this.#gpsTraceId = await gpsTraceService.createBlankTrace(
        this.#activityId,
        this.#userId
      );

      console.log(`GPS trace initialized: ${this.#gpsTraceId}`);

      // Start periodic save interval
      this.startPeriodicSave();

      console.log(
        `Activity tracking initialized for activity ${this.#activityId}`
      );

      return this.#activityId;
    } catch (error) {
      console.error("Erreur lors de l'initialisation de l'activité:", error);
      throw error;
    }
  };

  finalizeActivity = async (state = "finished") => {
    try {
      // Stop periodic save (will save one last time)
      await this.stopPeriodicSave();

      // Finalize GPS trace
      if (this.#gpsTraceId) {
        // Save any remaining GPS points before finalizing
        if (this.#gpsPointsBuffer.length > 0) {
          await gpsTraceService.updateTrace(
            this.#gpsTraceId,
            this.#gpsPointsBuffer
          );
          this.#gpsPointsBuffer = [];
        }

        // Finalize the trace (encode polyline, clear buffer, change state)
        await gpsTraceService.finalizeTrace(this.#gpsTraceId, state);
        console.log(`Trace GPS finalisée: ${this.#gpsTraceId} (${state})`);
      }

      // Reset buffers
      this.resetGpsBuffer();
      this.resetElevationData();

      console.log(
        `Activity tracking finalized for activity ${
          this.#activityId
        } (${state})`
      );
    } catch (error) {
      console.error("Erreur lors de la finalisation de l'activité:", error);
      throw error;
    }
  };

  addStartPosition = async (geoJsonPoint) => {
    await activityService.updateActivity(this.#activityId, {
      startPosition: {
        geometry: geoJsonPoint.geometry,
        timestamp: geoJsonPoint.timestamp,
        altitude: geoJsonPoint.altitude,
      },
    });
  };

  addEndPosition = async (geoJsonPoint) => {
    await activityService.updateActivity(this.#activityId, {
      endPosition: {
        geometry: geoJsonPoint.geometry,
        timestamp: geoJsonPoint.timestamp,
        altitude: geoJsonPoint.altitude,
      },
    });
  };

  handleElevationTracking = (data, elevationData) => {
    this.#currentElevation = parseFloat(elevationData?.height);

    if (!this.#currentElevation || isNaN(this.#currentElevation)) return;

    if (data.start) {
      this.#previousElevation = this.#currentElevation;
      this.#totalElevationGain = 0;
      this.#totalElevationLoss = 0;
      this.#maxAltitude = this.#currentElevation;
      this.#minAltitude = this.#currentElevation;
      console.log(`Tracking started at altitude: ${this.#currentElevation}m`);
      return;
    }

    if (data.stop) {
      console.log(
        `Tracking stopped. Total gain: ${this.#totalElevationGain.toFixed(
          2
        )}m, Total loss: ${this.#totalElevationLoss.toFixed(2)}m`
      );
      this.#previousElevation = null;
      return;
    }

    if (this.#previousElevation !== null) {
      const elevationChange = this.#currentElevation - this.#previousElevation;

      if (
        this.#currentElevation >
        this.#maxAltitude + Tracker.ELEVATION_THRESHOLD
      ) {
        this.#maxAltitude = this.#currentElevation;
        console.log(`New maximum altitude: ${this.#maxAltitude.toFixed(2)}m`);
      }
      if (
        this.#currentElevation <
        this.#minAltitude - Tracker.ELEVATION_THRESHOLD
      ) {
        this.#minAltitude = this.#currentElevation;
        console.log(`New minimum altitude: ${this.#minAltitude.toFixed(2)}m`);
      }

      if (elevationChange > Tracker.ELEVATION_THRESHOLD) {
        this.#totalElevationGain += elevationChange;
        console.log(
          `Elevation gain: +${elevationChange.toFixed(
            2
          )}m (Total: ${this.#totalElevationGain.toFixed(2)}m)`
        );
      } else if (elevationChange < -Tracker.ELEVATION_THRESHOLD) {
        this.#totalElevationLoss += Math.abs(elevationChange);
        console.log(
          `Elevation loss: ${elevationChange.toFixed(
            2
          )}m (Total: ${this.#totalElevationLoss.toFixed(2)}m)`
        );
      }
    }

    this.#previousElevation = this.#currentElevation;
  };

  resetElevationData = () => {
    this.#previousElevation = null;
    this.#totalElevationGain = 0;
    this.#totalElevationLoss = 0;
    this.#maxAltitude = 0;
    this.#minAltitude = 0;
  };

  startPeriodicSave = () => {
    if (!this.#activityId) return false;

    if (this.#periodicSaveInterval) return; // Éviter de créer plusieurs intervalles

    this.#periodicSaveInterval = setInterval(async () => {
      await this.savePeriodicData();
    }, this.#SAVING_INTERVAL);

    console.log("Intervalle de sauvegarde périodique démarré");

    return true;
  };

  stopPeriodicSave = async () => {
    await this.savePeriodicData();
    if (this.#periodicSaveInterval) {
      clearInterval(this.#periodicSaveInterval);
      this.#periodicSaveInterval = null;
      console.log("Intervalle de sauvegarde périodique arrêté");
    }
  };

  savePeriodicData = async () => {
    if (!this.#activityId) return;

    try {
      // Update activity elevation data
      const updateData = {
        elevationGain: this.#totalElevationGain,
        elevationLoss: this.#totalElevationLoss,
        altitude_max: this.#maxAltitude,
        altitude_min: this.#minAltitude,
      };

      // Save GPS points to trace if buffer is not empty
      if (this.#gpsPointsBuffer.length > 0 && this.#gpsTraceId) {
        await gpsTraceService.updateTrace(
          this.#gpsTraceId,
          this.#gpsPointsBuffer
        );
      }

      await activityService.updateActivity(this.#activityId, updateData);
      console.log(
        `Données sauvegardées pour l'activité ${this.#activityId}:`,
        updateData,
        `GPS points: ${this.#gpsPointsBuffer.length}`
      );
    } catch (error) {
      console.error("Erreur lors de la sauvegarde périodique:", error);
    } finally {
      this.#gpsPointsBuffer = [];
    }
  };
}
