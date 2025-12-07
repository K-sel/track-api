import mongoose from "mongoose";
const { Schema } = mongoose;

const ActivityTraceGPS = new Schema({
  activityId: {
    type: Schema.Types.ObjectId,
    ref: "Activity",
    required: true,
    unique: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  // Trace encodée (rempli uniquement quand state = "finished")
  encodedPolyline: { type: String, default: null }, // "u~w~Fs~{tE??AA..." - String compressée (50% plus léger)
  totalPoints: { type: Number, default: 0, min: 0 },

  samplingRate: { type: Number, default: 1, min: 0.1, max: 60 }, // 1 = 1 point/sec
  createdAt: { type: Date, default: Date.now },
});

// Auto-update updatedAt on save
ActivityTraceGPS.pre("save", function (next) {
  this.createdAt = Date.now();
  next();
});

export default mongoose.model("ActivityTraceGPS", ActivityTraceGPS);
