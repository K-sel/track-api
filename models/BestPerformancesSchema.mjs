import mongoose from "mongoose";
const { Schema } = mongoose;

const BestPerformancesSchema = new Schema({ 
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  // Distance de référence (5000, 10000, 21097, 42195)
  distance: { type: Number, required: true, min: 0 }, // meters

  // Meilleure performance actuelle
  bestPerformance: {
    chrono: { type: Number, required: true, min: 0 }, // seconds
    date: { type: Date, required: true },
    activityId: { type: Schema.Types.ObjectId, ref: "Activity", required: true },
  },

  // Historique des performances précédentes (quand ce record est battu)
  performanceHistory: [
    {
      chrono: { type: Number, required: true, min: 0 }, // seconds
      date: { type: Date, required: true },
      activityId: { type: Schema.Types.ObjectId, ref: "Activity" },
    },
  ],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Index composé pour recherche rapide par utilisateur et distance
BestPerformancesSchema.index({ userId: 1, distance: 1 }, { unique: true });

// Auto-update updatedAt on save
BestPerformancesSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("BestPerformances", BestPerformancesSchema);
