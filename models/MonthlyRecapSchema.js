import mongoose from "mongoose";
const { Schema } = mongoose;

const MonthlyRecapSchema = new Schema({
  _id: ObjectId,
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  // Time period
  year: { type: Number, required: true, min: 2000, max: 2100 },
  month: { type: Number, required: true, min: 1, max: 12 },
  
  // Stats
  totalKm: { type: Number, default: 0, min: 0 },
  totalActivities: { type: Number, default: 0, min: 0 },
  totalTime: { type: Number, default: 0, min: 0 }, // seconds
  totalElevation: { type: Number, default: 0, min: 0 }, // meters
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound unique index to prevent duplicate recaps for same user/month/year
MonthlyRecapSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

// Index for querying recaps by year
MonthlyRecapSchema.index({ userId: 1, year: -1 });

// Auto-update updatedAt on save
MonthlyRecapSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('MonthlyRecap', MonthlyRecapSchema)
