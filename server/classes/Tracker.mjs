import { haversine } from "../../services/haversineFormula.mjs";
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
  #SAVING_INTERVAL = 10000; // 10000ms = 10 secondes
  #gpsPointsBuffer = []; // Buffer pour stocker les points GPS en mémoire
  #previousPoint = null;

  static ELEVATION_THRESHOLD = 0;

  constructor(userId, activityId) {
    this.#activityId = activityId;
    this.#userId = userId;
  }

  appendGpsBuffer(geoJsonPoint) {
    this.#gpsPointsBuffer.push(geoJsonPoint);
    console.log("New geoJsonPoint pushed to buffer : ", geoJsonPoint);
  }

  resetGpsBuffer() {
    this.#gpsPointsBuffer = [];
  }

  async initGpsTrace() {
    try {
      this.#gpsTraceId = await gpsTraceService.createBlankTrace(
        this.#activityId,
        this.#userId
      );
      console.log(`GPS trace initialized: ${this.#gpsTraceId}`);
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la trace GPS:", error);
      throw error;
    }
  }

  updateDuration = async () => {
    const activity = await activityService.getActivity(this.#activityId);

    if (activity) {
      const ms = Math.abs(
        new Date(activity.endPosition.timestamp).getTime() -
          new Date(activity.startPosition.timestamp).getTime()
      );
      activity.duration = ms;
      await activity.save();
    }
  };

  updateDistance = async (geoJsonPoint) => {
    if (this.#previousPoint == null) {
      this.#previousPoint = geoJsonPoint;
      return null;
    } else {
      const distance = haversine(this.#previousPoint, geoJsonPoint);
      const activity = await activityService.getActivity(this.#activityId);

      if (activity) {
        activity.distance += distance;
        await activity.save();
        this.#previousPoint = geoJsonPoint;
      }
    }
  };

  updateSpeed = async () => {
    const activity = await activityService.getActivity(this.#activityId);

    if (activity.duration > 0) {
      const hours = activity.duration / 3600000;
      activity.avgSpeed = activity.distance / hours;
      await activity.save();
    }
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
      this.resetElevationData();
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

  async finalizeGpsTrace(state = "finished") {
    if (!this.#gpsTraceId) {
      console.warn("Aucune trace GPS à finaliser");
      return;
    }

    try {
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
    } catch (error) {
      console.error("Erreur lors de la finalisation de la trace GPS:", error);
      throw error;
    }
  }
}
