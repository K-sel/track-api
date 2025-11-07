import mongoose from "mongoose";
const { Schema } = mongoose;

const PersonalRecordsSchema = new Schema({
  _id: ObjectId,
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  activityId: { type: Schema.Types.ObjectId, ref: 'Activity', required: true, unique: true },
  
  activityType: { 
    type: String, 
    required: true,
    enum: ['run', 'trail', 'walk', 'cycling', 'hiking']
  },
  
  date: { type: Date, required: true },
  
  distance: { type: Number, required: true, min: 0 }, // meters
  chrono: { type: Number, required: true, min: 0 }, // seconds
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index for efficient queries: find records by user and activity type
PersonalRecordsSchema.index({ userId: 1, activityType: 1 });

// Index for querying all records by activity type
PersonalRecordsSchema.index({ activityType: 1 });

// Auto-update updatedAt on save
PersonalRecordsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('PersonalRecords', PersonalRecordsSchema)
