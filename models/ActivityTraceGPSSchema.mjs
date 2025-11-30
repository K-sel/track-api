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

  state: {
    type: String,
    enum: ["recording", "finished", "interrupted"],
    default: "recording",
    required: true,
  },

  // Buffer temporaire de points GPS durant l'activité (vidé après encodage)
  gpsBuffer: {
    type: [
      {
        geometry: {
          type: { type: String, enum: ["Point"], default: "Point" },
          coordinates: { type: [Number], required: true }, // [longitude, latitude, altitude?]
        },
        timestamp: { type: Date, default: Date.now },
        altitude: Number, // altitude en mètres
      },
    ],
    default: [],
  },

  // Trace encodée (rempli uniquement quand state = "finished")
  encodedPolyline: { type: String, default: null }, // "u~w~Fs~{tE??AA..." - String compressée (50% plus léger)
  totalPoints: { type: Number, default: 0, min: 0 },

  samplingRate: { type: Number, default: 1, min: 0.1, max: 60 }, // 1 = 1 point/sec
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("ActivityTraceGPS", ActivityTraceGPS);
