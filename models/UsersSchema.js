import mongoose from "mongoose";
const { Schema } = mongoose;

const UserSchema = new Schema({
  // Auth
  _id: ObjectId,
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: { type: String, required: true, minlength: 6 }, // hashed
  
  // Profile
  firstname: { type: String, required: true, trim: true },
  lastname: { type: String, required: true, trim: true },
  age: { type: Number, min: 13, max: 120 },
  
  // Activity Stats (embedded - aggregated values)
  activityStats: {
    totalKmEver: { type: Number, default: 0, min: 0 },
    totalKmYear: { type: Number, default: 0, min: 0 },
    totalKmPast7Days: { type: Number, default: 0, min: 0 },
    totalKmCurrentWeek: { type: Number, default: 0, min: 0 },
    
    totalTimeActivity: { type: Number, default: 0, min: 0 }, // seconds
    
    totalActivities: { type: Number, default: 0, min: 0 },
    totalActivitiesLast7Days: { type: Number, default: 0, min: 0 },
    totalActivitiesMonth: { type: Number, default: 0, min: 0 },
    totalActivitiesCurrentWeek: { type: Number, default: 0, min: 0 },
    
    lastUpdated: { type: Date, default: Date.now }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for email lookups (login)
UserSchema.index({ email: 1 });

// Auto-update updatedAt on save
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('User', UserSchema)
