const MonthlyRecapSchema = new Schema({
  _id: ObjectId,
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Stats
  year: Number,
  month: Number,
  totalKm: Number,
  totalActivities: Number,
  totalTime: Number,
  totalElevation: Number,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});