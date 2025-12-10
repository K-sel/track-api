import BestPerformances from "../models/BestPerformancesSchema.mjs";
import { calculatePace } from "../utils/calculatePace.mjs";
import { formatTime } from "../utils/formatTime.mjs";

const REFERENCE_DISTANCES = {
  "5K": 5000,
  "10K": 10000,
  SEMI: 21097.5,
  MARATHON: 42195,
};

export const bestPerformancesService = {
  checkAndUpdate: async (activity, userId) => {
    const activityDistance = activity.distance; // en mètres
    const activityTime = activity.moving_duration; // en secondes

    const newRecords = [];

    for (let [distanceName, referenceDistance] of Object.entries(REFERENCE_DISTANCES)) {
      if (activityDistance >= referenceDistance) {
        let userRecord = await BestPerformances.findOne({ userId, distance: referenceDistance});

        const isNewRecord = !userRecord || userRecord.bestPerformance.chrono > activityTime;

        if (isNewRecord) {
          if (userRecord) {
            userRecord.performanceHistory.push({
              chrono: userRecord.bestPerformance.chrono,
              date: userRecord.bestPerformance.date,
              activityId: userRecord.bestPerformance.activityId,
            });

            userRecord.bestPerformance.chrono = activityTime;
            userRecord.bestPerformance.date = new Date();
            userRecord.bestPerformance.activityId = activity._id;

            await userRecord.save();
          } else {
            // Créer un nouveau document pour ce record
            userRecord = new BestPerformances({
              userId,
              distance: referenceDistance,
              bestPerformance: {
                chrono: activityTime,
                date: new Date(),
                activityId: activity._id,
              },
              performanceHistory: [],
            });

            await userRecord.save();
          }

          newRecords.push({
            distance: distanceName,
            chrono: activityTime,
            chronoFormatted: formatTime(activityTime),
            pace: calculatePace(referenceDistance, activityTime),
            message: `You just set a new PR on ${distanceName}!`,
          });
        }
      }
    }

    return newRecords.length > 0 ? newRecords : null;
  },

  getBestPerformances: async (userId) => {
    const records = await BestPerformances.find({ userId })
      .populate("bestPerformance.activityId")
      .sort({ distance: 1 })
      .exec();

    return records.map((record) => ({
      distance: record.distance,
      chrono: record.bestPerformance.chrono,
      chronoFormatted: formatTime(record.bestPerformance.chrono),
      pace: calculatePace(record.distance, record.bestPerformance.chrono),
      date: record.bestPerformance.date,
      activityId: record.bestPerformance.activityId,
    }));
  },

  getDistanceHistory: async (userId, distance) => {
    const record = await BestPerformances.findOne({ userId, distance })
      .populate("bestPerformance.activityId")
      .populate("performanceHistory.activityId")
      .exec();

    if (!record) {
      return null;
    }

    return {
      actual: {
        chrono: record.bestPerformance.chrono,
        chronoFormatted: formatTime(record.bestPerformance.chrono),
        pace: calculatePace(distance, record.bestPerformance.chrono),
        date: record.bestPerformance.date,
        activityId: record.bestPerformance.activityId,
      },
      history: record.performanceHistory.map((perf) => ({
        chrono: perf.chrono,
        chronoFormatted: formatTime(perf.chrono),
        pace: calculatePace(distance, perf.chrono),
        date: perf.date,
        activityId: perf.activityId,
      })),
    };
  },
};
