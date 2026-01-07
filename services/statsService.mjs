import UsersSchema from "../models/UsersSchema.mjs";
import YearlyStats from "../models/stats/YearlyStatsSchema.mjs";
import MonthlyStats from "../models/stats/MonthlyStatsSchema.mjs";
import WeeklyStats from "../models/stats/WeeklyStatsSchema.mjs";
import { getISOWeek } from "../utils/getWeekNumber.mjs";

// the stats are automatically resetted ever month, week and year with a CRON trigger in mongoDB atlas
// send email to one of the contributors for any specific request about these triggers.

export const statsService = {
  update: async (activity, userId) => {
    const user = await UsersSchema.findById(userId);

    if(!user) throw new Error(`User ${userId} not found`);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentWeek = getISOWeek(now);

    user.activityStats.totalKmEver += activity.distance / 1000;
    user.activityStats.totalKmYear += activity.distance / 1000;
    user.activityStats.totalKmWeek += activity.distance / 1000;
    user.activityStats.totalKmMonth += activity.distance / 1000;

    user.activityStats.totalTimeEver += activity.moving_duration;
    user.activityStats.totalTimeYear += activity.moving_duration;
    user.activityStats.totalTimeMonth += activity.moving_duration;
    user.activityStats.totalTimeWeek += activity.moving_duration;

    user.activityStats.totalActivitiesEver += 1;
    user.activityStats.totalActivitiesYear += 1;
    user.activityStats.totalActivitiesMonth += 1;
    user.activityStats.totalActivitiesWeek += 1;

    user.activityStats.totalElevationEver += activity.elevationGain;
    user.activityStats.totalElevationYear += activity.elevationGain;
    user.activityStats.totalElevationMonth += activity.elevationGain;
    user.activityStats.totalElevationWeek += activity.elevationGain;

    await user.save();

    // Incrémenter YearlyStats pour l'année actuelle
    await YearlyStats.findOneAndUpdate(
      { userId, year: currentYear },
      {
        $inc: {
          totalKm: activity.distance / 1000,
          totalTime: activity.moving_duration,
          totalActivities: 1,
          totalElevation: activity.elevationGain,
        },
      },
      { upsert: true, new: true }
    );

    // Incrémenter MonthlyStats pour le mois actuel
    await MonthlyStats.findOneAndUpdate(
      { userId, year: currentYear, month: currentMonth },
      {
        $inc: {
          totalKm: activity.distance / 1000,
          totalTime: activity.moving_duration,
          totalActivities: 1,
          totalElevation: activity.elevationGain,
        },
      },
      { upsert: true, new: true }
    );

    // Incrémenter WeeklyStats pour la semaine actuelle
    await WeeklyStats.findOneAndUpdate(
      { userId, year: currentYear, week: currentWeek },
      {
        $inc: {
          totalKm: activity.distance / 1000,
          totalTime: activity.moving_duration,
          totalActivities: 1,
          totalElevation: activity.elevationGain,
        },
      },
      { upsert: true, new: true }
    );
  },

  remove: async (activity, userId, session = null) => {
    const user = await UsersSchema.findById(userId).session(session);

    if(!user) throw new Error(`User ${userId} not found`);

    const activityDate = new Date(activity.date);
    const activityYear = activityDate.getFullYear();
    const activityMonth = activityDate.getMonth() + 1;
    const activityWeek = getISOWeek(activityDate);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentWeek = getISOWeek(now);

    // Décrémenter totalEver (toujours)
    user.activityStats.totalKmEver = Math.max(0, user.activityStats.totalKmEver - activity.distance / 1000);
    user.activityStats.totalTimeEver = Math.max(0, user.activityStats.totalTimeEver - activity.moving_duration);
    user.activityStats.totalActivitiesEver = Math.max(0, user.activityStats.totalActivitiesEver - 1);
    user.activityStats.totalElevationEver = Math.max(0, user.activityStats.totalElevationEver - activity.elevationGain);

    // Décrémenter stats de l'année en cours si l'activité est de cette année
    if (activityYear === currentYear) {
      user.activityStats.totalKmYear = Math.max(0, user.activityStats.totalKmYear - activity.distance / 1000);
      user.activityStats.totalTimeYear = Math.max(0, user.activityStats.totalTimeYear - activity.moving_duration);
      user.activityStats.totalActivitiesYear = Math.max(0, user.activityStats.totalActivitiesYear - 1);
      user.activityStats.totalElevationYear = Math.max(0, user.activityStats.totalElevationYear - activity.elevationGain);
    }

    // Décrémenter stats du mois en cours si l'activité est de ce mois
    if (activityYear === currentYear && activityMonth === currentMonth) {
      user.activityStats.totalKmMonth = Math.max(0, user.activityStats.totalKmMonth - activity.distance / 1000);
      user.activityStats.totalTimeMonth = Math.max(0, user.activityStats.totalTimeMonth - activity.moving_duration);
      user.activityStats.totalActivitiesMonth = Math.max(0, user.activityStats.totalActivitiesMonth - 1);
      user.activityStats.totalElevationMonth = Math.max(0, user.activityStats.totalElevationMonth - activity.elevationGain);
    }

    // Décrémenter stats de la semaine en cours si l'activité est de cette semaine
    if (activityYear === currentYear && activityWeek === currentWeek) {
      user.activityStats.totalKmWeek = Math.max(0, user.activityStats.totalKmWeek - activity.distance / 1000);
      user.activityStats.totalTimeWeek = Math.max(0, user.activityStats.totalTimeWeek - activity.moving_duration);
      user.activityStats.totalActivitiesWeek = Math.max(0, user.activityStats.totalActivitiesWeek - 1);
      user.activityStats.totalElevationWeek = Math.max(0, user.activityStats.totalElevationWeek - activity.elevationGain);
    }

    await user.save({ session });

    // Mettre à jour YearlyStats
    const yearlyStats = await YearlyStats.findOne({ userId, year: activityYear }).session(session);
    if (yearlyStats) {
      yearlyStats.totalKm = Math.max(0, yearlyStats.totalKm - activity.distance / 1000);
      yearlyStats.totalTime = Math.max(0, yearlyStats.totalTime - activity.moving_duration);
      yearlyStats.totalActivities = Math.max(0, yearlyStats.totalActivities - 1);
      yearlyStats.totalElevation = Math.max(0, yearlyStats.totalElevation - activity.elevationGain);
      await yearlyStats.save({ session });
    }

    // Mettre à jour MonthlyStats
    const monthlyStats = await MonthlyStats.findOne({ userId, year: activityYear, month: activityMonth }).session(session);
    if (monthlyStats) {
      monthlyStats.totalKm = Math.max(0, monthlyStats.totalKm - activity.distance / 1000);
      monthlyStats.totalTime = Math.max(0, monthlyStats.totalTime - activity.moving_duration);
      monthlyStats.totalActivities = Math.max(0, monthlyStats.totalActivities - 1);
      monthlyStats.totalElevation = Math.max(0, monthlyStats.totalElevation - activity.elevationGain);
      await monthlyStats.save({ session });
    }

    // Mettre à jour WeeklyStats
    const weeklyStats = await WeeklyStats.findOne({ userId, year: activityYear, week: activityWeek }).session(session);
    if (weeklyStats) {
      weeklyStats.totalKm = Math.max(0, weeklyStats.totalKm - activity.distance / 1000);
      weeklyStats.totalTime = Math.max(0, weeklyStats.totalTime - activity.moving_duration);
      weeklyStats.totalActivities = Math.max(0, weeklyStats.totalActivities - 1);
      weeklyStats.totalElevation = Math.max(0, weeklyStats.totalElevation - activity.elevationGain);
      await weeklyStats.save({ session });
    }
  },
};
