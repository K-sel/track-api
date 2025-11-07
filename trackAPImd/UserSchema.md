const UserSchema = new Schema({
  // Auth
  _id: ObjectId,
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }, // hashed
  
  // Profile
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  age: Number,
  
  updatedAt: { type: Date, default: Date.now }

  // Activity Stats (embedded - aggregated values)
  activityStats: {
    totalKmEver: { type: Number, default: 0 },
    totalKmYear: { type: Number, default: 0 },
    totalKmPast7Days: { type: Number, default: 0 },
    totalKmCurrentWeek: { type: Number, default: 0 },
    
    totalTimeActivity: { type: Number, default: 0 }, // seconds
    
    totalActivities: { type: Number, default: 0 },
    totalActivitiesLast7Days: { type: Number, default: 0 },
    totalActivitiesMonth: { type: Number, default: 0 },
    totalActivitiesCurrentWeek: { type: Number, default: 0 },
    
    lastUpdated: { type: Date, default: Date.now }
  },
  
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});