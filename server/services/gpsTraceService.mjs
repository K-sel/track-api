import { WSServerError } from "wsmini";
import GpsTrace from "../../models/ActivityTraceGPSSchema.mjs";
import Activity from "../../models/ActivitySchema.mjs";
import mongoose from "mongoose";
import polyline from "@mapbox/polyline";

export const gpsTraceService = {

  createBlankTrace: async (activityId, userId) => {
    if (!activityId) throw new WSServerError(400, "ActivityId est requis");
    if (!userId) throw new WSServerError(400, "UserId est requis");

    if (!mongoose.Types.ObjectId.isValid(activityId))
      throw new WSServerError(400, "ActivityId invalide");

    if (!mongoose.Types.ObjectId.isValid(userId))
      throw new WSServerError(400, "UserId invalide");

    try {
      // Verify activity exists
      const activity = await Activity.findById(activityId);
      if (!activity) {
        throw new WSServerError(404, "Activité introuvable");
      }

      // Create blank GPS trace
      const gpsTrace = new GpsTrace({
        activityId,
        userId,
        state: "recording",
        gpsBuffer: [],
        totalPoints: 0,
      });

      await gpsTrace.save();

      // Link GPS trace to activity
      activity.gpsTraceId = gpsTrace._id;
      await activity.save();

      console.log(
        `GPS trace ${gpsTrace._id} created for activity ${activityId}`
      );

      return gpsTrace._id.toString();
    } catch (error) {
      if (error instanceof WSServerError) {
        throw error;
      }
      if (error.name === "ValidationError") {
        throw new WSServerError(400, `Erreur de validation: ${error.message}`);
      }
      throw new WSServerError(
        500,
        `Erreur lors de la création de la trace GPS: ${error.message}`
      );
    }
  },

 
  updateTrace: async (gpsTraceId, buffer) => {
    if (!buffer || !Array.isArray(buffer) || buffer.length === 0) {
      throw new WSServerError(400, "Buffer doit être un tableau non vide");
    }

    if (!gpsTraceId) throw new WSServerError(400, "GpsTraceId est requis");

    if (!mongoose.Types.ObjectId.isValid(gpsTraceId))
      throw new WSServerError(400, "GpsTraceId invalide");

    try {
      const gpsTrace = await GpsTrace.findById(gpsTraceId);

      if (!gpsTrace) {
        throw new WSServerError(404, "GpsTrace introuvable");
      }

      // Append new points to buffer
      gpsTrace.gpsBuffer.push(...buffer);
      gpsTrace.totalPoints += buffer.length;

      await gpsTrace.save();

      console.log(
        `${buffer.length} points ajoutés à la trace GPS ${gpsTraceId} (total: ${gpsTrace.totalPoints})`
      );

      return gpsTrace;
    } catch (error) {
      if (error instanceof WSServerError) {
        throw error;
      }
      if (error.name === "ValidationError") {
        throw new WSServerError(400, `Erreur de validation: ${error.message}`);
      }
      throw new WSServerError(
        500,
        `Erreur lors de la mise à jour de la trace GPS: ${error.message}`
      );
    }
  },

  
  finalizeTrace: async (gpsTraceId, state = "finished") => {
    if (!gpsTraceId) throw new WSServerError(400, "GpsTraceId est requis");

    if (!mongoose.Types.ObjectId.isValid(gpsTraceId))
      throw new WSServerError(400, "GpsTraceId invalide");

    if (!["finished", "interrupted"].includes(state)) {
      throw new WSServerError(400, "State doit être 'finished' ou 'interrupted'");
    }

    try {
      const gpsTrace = await GpsTrace.findById(gpsTraceId);

      if (!gpsTrace) {
        throw new WSServerError(404, "GpsTrace introuvable");
      }

      if (gpsTrace.state !== "recording") {
        throw new WSServerError(
          400,
          "La trace GPS n'est pas en cours d'enregistrement"
        );
      }

      // Encode polyline only if there are GPS points and state is "finished"
      if (gpsTrace.gpsBuffer.length > 0 && state === "finished") {
        // Convert GPS buffer to [lat, lng] format for polyline encoding
        const coordinates = gpsTrace.gpsBuffer.map((point) => [
          point.geometry.coordinates[1], // latitude
          point.geometry.coordinates[0], // longitude
        ]);

        gpsTrace.encodedPolyline = polyline.encode(coordinates);
        console.log(
          `Polyline encodée pour la trace GPS ${gpsTraceId}: ${gpsTrace.encodedPolyline.length} caractères`
        );
      }

      // Update state and clear buffer
      gpsTrace.state = state;
      gpsTrace.gpsBuffer = [];

      await gpsTrace.save();

      console.log(
        `Trace GPS ${gpsTraceId} finalisée avec le statut: ${state}`
      );

      return gpsTrace;
    } catch (error) {
      if (error instanceof WSServerError) {
        throw error;
      }
      if (error.name === "ValidationError") {
        throw new WSServerError(400, `Erreur de validation: ${error.message}`);
      }
      throw new WSServerError(
        500,
        `Erreur lors de la finalisation de la trace GPS: ${error.message}`
      );
    }
  },

 
  getTrace: async (gpsTraceId) => {
    if (!gpsTraceId) throw new WSServerError(400, "GpsTraceId est requis");

    if (!mongoose.Types.ObjectId.isValid(gpsTraceId))
      throw new WSServerError(400, "GpsTraceId invalide");

    try {
      const gpsTrace = await GpsTrace.findById(gpsTraceId);

      if (!gpsTrace) {
        throw new WSServerError(404, "GpsTrace introuvable");
      }

      return gpsTrace;
    } catch (error) {
      if (error instanceof WSServerError) {
        throw error;
      }
      throw new WSServerError(
        500,
        `Erreur lors de la récupération de la trace GPS: ${error.message}`
      );
    }
  },

  getTraceByActivityId: async (activityId) => {
    if (!activityId) throw new WSServerError(400, "ActivityId est requis");

    if (!mongoose.Types.ObjectId.isValid(activityId))
      throw new WSServerError(400, "ActivityId invalide");

    try {
      const gpsTrace = await GpsTrace.findOne({ activityId });
      return gpsTrace;
    } catch (error) {
      throw new WSServerError(
        500,
        `Erreur lors de la récupération de la trace GPS: ${error.message}`
      );
    }
  },
};
