const PersonalRecordsSchema = new Schema({
  _id: ObjectId,
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  activityId: { type: Schema.Types.ObjectId, ref: 'Activity', required: true, unique: true },
  
  activityType: { 
    type: String, 
    required: true,
    enum: ['run', 'trail', 'walk', 'cycling', 'hiking']
  },
  
  date: { type: Date, required: true },
  
  distance: { type: Number, required: true }, // meters
  chrono : { type: Number, required: true },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});