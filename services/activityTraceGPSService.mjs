export const activityTraceGPSService = {
  create: async (activtiyId, userId, trace) => {
    const coordinates = trace.map((point) => [
      point.geometry.coordinates[1], // latitude
      point.geometry.coordinates[0], // longitude
    ]);

    const totalPoints = trace.length;
    const encodedPolyline = polyline.encode(coordinates);

    const activityTraceData = {
      activtiyId: activtiyId,
      userId: userId,

      encodedPolyline: encodedPolyline,
      totalPoints: totalPoints,

      samplingRate: 1,
    };

    const newActivityTraceGPS = newActivityTraceGPS(activityTraceData);
    const savedActivityTrace = await newActivityTraceGPS.save();

    return savedActivityTrace._id
  },
};
