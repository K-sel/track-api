import BestPerformances from "../models/BestPerformancesSchema.mjs";
import { calculatePace } from "../utils/calculatePace.mjs";
import { formatTime } from "../utils/formatTime.mjs";

const REFERENCE_DISTANCES = {
  "5K": 5000,
  "10K": 10000,
  SEMI: 21097.5,
  MARATHON: 42195,
};

/**
 * Calcule le temps exact à une distance de référence en parcourant les laps
 * @param {Object} activity - L'activité avec ses laps
 * @param {Number} targetDistance - Distance cible en mètres
 * @returns {Number|null} Temps en secondes ou null si impossible à calculer
 */
function calculateTimeAtDistance(activity, targetDistance) {
  if (!activity.laps || activity.laps.length === 0) {
    // Pas de laps, on utilise l'activité complète seulement si distance proche
    const tolerance = 100; // 100m de tolérance
    if (Math.abs(activity.distance - targetDistance) <= tolerance) {
      return activity.moving_duration;
    }
    return null;
  }

  let cumulativeDistance = 0;
  let cumulativeTime = 0;

  for (let i = 0; i < activity.laps.length; i++) {
    const lap = activity.laps[i];
    const lapDistance = lap.distance;
    const lapDuration = (lap.finished_at - lap.started_at) / 1000; // timestamps en ms -> secondes

    // Si on atteint exactement ou dépasse la distance cible
    if (cumulativeDistance + lapDistance >= targetDistance) {
      const remainingDistance = targetDistance - cumulativeDistance;

      if (remainingDistance === 0) {
        // Distance exacte atteinte à la fin du lap précédent
        return cumulativeTime;
      }

      // Interpolation linéaire dans le lap actuel
      const lapProgress = remainingDistance / lapDistance;
      const timeInLap = lapDuration * lapProgress;

      return cumulativeTime + timeInLap;
    }

    cumulativeDistance += lapDistance;
    cumulativeTime += lapDuration;
  }

  // Si on arrive ici, l'activité est plus courte que la distance cible
  return null;
}

export const bestPerformancesService = {
  checkAndUpdate: async (activity, userId) => {
    const activityDistance = activity.distance; // en mètres
    const activityTime = activity.moving_duration; // en secondes

    const newRecords = [];

    for (let [distanceName, referenceDistance] of Object.entries(REFERENCE_DISTANCES)) {
      if (activityDistance >= referenceDistance) {
        // Calculer le temps exact à la distance de référence
        const timeAtDistance = calculateTimeAtDistance(activity, referenceDistance);

        if (!timeAtDistance) continue; // Impossible de calculer, on skip

        let userRecord = await BestPerformances.findOne({ userId, distance: referenceDistance});

        const isNewRecord = !userRecord || userRecord.bestPerformance.chrono > timeAtDistance;

        if (isNewRecord) {
          if (userRecord) {
            userRecord.performanceHistory.push({
              chrono: userRecord.bestPerformance.chrono,
              date: userRecord.bestPerformance.date,
              activityId: userRecord.bestPerformance.activityId,
            });

            userRecord.bestPerformance.chrono = timeAtDistance;
            userRecord.bestPerformance.date = new Date();
            userRecord.bestPerformance.activityId = activity._id;

            await userRecord.save();
          } else {
            // Créer un nouveau document pour ce record
            userRecord = new BestPerformances({
              userId,
              distance: referenceDistance,
              bestPerformance: {
                chrono: timeAtDistance,
                date: new Date(),
                activityId: activity._id,
              },
              performanceHistory: [],
            });

            await userRecord.save();
          }

          newRecords.push({
            distance: distanceName,
            chrono: timeAtDistance,
            chronoFormatted: formatTime(timeAtDistance),
            pace: calculatePace(referenceDistance, timeAtDistance),
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
