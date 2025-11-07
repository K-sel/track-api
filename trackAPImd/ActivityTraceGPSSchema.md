const ActivityTraceGPSSchema = new Schema({
  _id: ObjectId,
  activityId: { type: Schema.Types.ObjectId, ref: 'Activity', required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
 
  encodedPolyline: "u~w~Fs~{tE??AA...",  // ← String compressée (50% plus léger)
  totalPoints: 3600,

  samplingRate: { type: Number, default: 1 }, // 1 = 1 point/sec
  createdAt: { type: Date, default: Date.now }
});