import Activity from "../../models/ActivitySchema.mjs";
import { WSServerError } from "wsmini";
import mongoose from "mongoose";

const VALID_ACTIVITY_TYPES = [
  "run",
  "trail",
  "walk",
  "cycling",
  "hiking",
  "other",
];

const activityService = {
  createBlankActivity: async (userId, activityType = "run") => {
    if (!userId) {
      throw new WSServerError(400, "userId est requis");
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new WSServerError(400, "userId invalide");
    }

    if (!VALID_ACTIVITY_TYPES.includes(activityType)) {
      throw new WSServerError(
        400,
        `Type d'activité invalide. Valeurs acceptées: ${VALID_ACTIVITY_TYPES.join(
          ", "
        )}`
      );
    }

    try {
      const now = new Date();
      const activity = await Activity.create({
        userId: userId,
        date: now,
        activityType: activityType,

        // Timing
        startedAt: now,
        stoppedAt: new Date(now.getTime() + 1000), // +1 seconde pour éviter l'erreur de validation
        duration: 0,
        moving_duration: 0,

        // Distance
        distance: 0,
        avgSpeed: 0,

        // Elevation
        elevationGain: 0,
        elevationLoss: 0,
        altitude_max: undefined,
        altitude_min: undefined,
        altitude_avg: undefined,

        // Position - coordonnées temporaires [0, 0]
        startPosition: {
          geometry: {
            type: "Point",
            coordinates: [0, 0],
          },
          timestamp: now,
          altitude: 0,
        },
        endPosition: {
          geometry: {
            type: "Point",
            coordinates: [0, 0],
          },
          timestamp: now,
          altitude: 0,
        },

        // GPS Trace
        gpsTraceId: null,

        // Medias
        medias: [],

        // Weather
        weather: undefined,

        // Difficulty
        difficultyScore: 1.0,
        difficultyFactors: {
          baseScore: 1.0,
          elevationBonus: 0,
          weatherBonus: 0,
          windBonus: 0,
          temperatureBonus: 0,
        },

        // Optional fields
        notes: undefined,
        feeling: undefined,

        // Calories
        estimatedCalories: undefined,
      });

      await activity.save()
      return activity._id;
    } catch (error) {
      console.error("Erreur détaillée lors de la création de l'activité:", error);
      if (error.name === "ValidationError") {
        throw new WSServerError(400, `Erreur de validation: ${error.message}`);
      }
      throw new WSServerError(
        500,
        `Erreur lors de la création de l'activité: ${error.message}`
      );
    }
  },

  getActivity: async (activityId) => {
    if (!activityId) {
      throw new WSServerError(400, "activityId est requis");
    }

    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      throw new WSServerError(400, "activityId invalide");
    }

    try {
      const activity = await Activity.findById(activityId);

      if (!activity) {
        throw new WSServerError(404, "Activité introuvable");
      }

      return activity;
    } catch (error) {
      if (error instanceof WSServerError) {
        throw error;
      }
      throw new WSServerError(
        500,
        `Erreur lors de la récupération de l'activité: ${error.message}`
      );
    }
  },

  updateActivity: async (activityId, updateData) => {
    if (!activityId) {
      throw new WSServerError(400, "activityId est requis");
    }

    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      throw new WSServerError(400, "activityId invalide");
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      throw new WSServerError(400, "Aucune donnée à mettre à jour");
    }

    try {
      const activity = await Activity.findByIdAndUpdate(activityId, updateData, {
        new: true,
        runValidators: true,
      });

      if (!activity) {
        throw new WSServerError(404, "Activité introuvable");
      }

      return activity;
    } catch (error) {
      if (error instanceof WSServerError) {
        throw error;
      }
      if (error.name === "ValidationError") {
        throw new WSServerError(400, `Erreur de validation: ${error.message}`);
      }
      throw new WSServerError(
        500,
        `Erreur lors de la mise à jour de l'activité: ${error.message}`
      );
    }
  },
};

export default activityService;
