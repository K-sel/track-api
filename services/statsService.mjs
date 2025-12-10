import UsersSchema from "../models/UsersSchema.mjs";

// the stats are automatically resetted ever month, week and year with a CRON trigger in mongoDB atlas
// send email to one of the contributors for any specific request about these triggers.

export const statsService = {
  update: async (activity, userId) => {
    const user = await UsersSchema.findById(userId);

    if(!user) throw new Error(`User ${userId} not found`);

    user.activityStats.totalKmEver += activity.distance / 1000;
    user.activityStats.totalKmYear += activity.distance / 1000;
    user.activityStats.totalKmWeek += activity.distance / 1000;
    user.activityStats.totalKmMonth += activity.distance / 1000;

    user.activityStats.totalTimeEver += activity.duration;
    user.activityStats.totalTimeYear += activity.duration;
    user.activityStats.totalTimeMonth += activity.duration;
    user.activityStats.totalTimeWeek += activity.duration;

    user.activityStats.totalActivitiesEver += 1;
    user.activityStats.totalActivitiesYear += 1;
    user.activityStats.totalActivitiesMonth += 1;
    user.activityStats.totalActivitiesWeek += 1;

    user.activityStats.totalElevationEver += activity.elevationGain;
    user.activityStats.totalElevationYear += activity.elevationGain;
    user.activityStats.totalElevationMonth += activity.elevationGain;
    user.activityStats.totalElevationWeek += activity.elevationGain;

    await user.save();
  },
};
