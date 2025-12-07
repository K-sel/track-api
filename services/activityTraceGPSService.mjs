import polyline from "@mapbox/polyline";
import ActivityTraceGPS from "../models/ActivityTraceGPSSchema.mjs";

export const activityTraceGPSService = {
  create: async (activityId, userId, trace) => {
    const coordinates = trace.map((point) => [
      point.geometry.coordinates[1], // latitude
      point.geometry.coordinates[0], // longitude
    ]);

    const totalPoints = trace.length;
    const encodedPolyline = polyline.encode(coordinates);

    const activityTraceData = {
      activityId: activityId,
      userId: userId,

      encodedPolyline: encodedPolyline,
      totalPoints: totalPoints,

      samplingRate: 1,
    };

    const newActivityTraceGPS = new ActivityTraceGPS(activityTraceData);
    const savedActivityTrace = await newActivityTraceGPS.save();

    return savedActivityTrace._id;
  },
};
