import mongoose from "mongoose";
const { Schema } = mongoose;

const ActivityTraceGPSSchema = new Schema({
  _id: ObjectId,
  activityId: { type: Schema.Types.ObjectId, ref: 'Activity', required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
 
  encodedPolyline: { type: String, required: true }, // "u~w~Fs~{tE??AA..." - String compressée (50% plus léger)
  totalPoints: { type: Number, required: true, min: 0 },

  samplingRate: { type: Number, default: 1, min: 0.1, max: 60 }, // 1 = 1 point/sec
  createdAt: { type: Date, default: Date.now }
});

// Index for finding traces by user
ActivityTraceGPSSchema.index({ userId: 1 });

// Index for finding trace by activity (already unique, but explicit index helps)
ActivityTraceGPSSchema.index({ activityId: 1 });

export default mongoose.model('ActivityTraceGPS', ActivityTraceGPSSchema)
