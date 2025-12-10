import mongoose from "mongoose";
const { Schema } = mongoose;

const UserSchema = new Schema({
  // Auth
  username: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
  },

  password: { type: String, required: true }, // hashed

  // Profile
  firstname: { type: String, required: true, trim: true },
  lastname: { type: String, required: true, trim: true },
  age: { type: Number, min: 13, max: 120 },
  weight: { type: Number, min: 0, max: 500 },

  // Activity Stats (embedded - aggregated values)
  activityStats: {
    totalKmEver: { type: Number, default: 0, min: 0 },
    totalKmYear: { type: Number, default: 0, min: 0 },
    totalKmMonth: { type: Number, default: 0, min: 0 },
    totalKmWeek: { type: Number, default: 0, min: 0 },

    totalTimeEver: { type: Number, default: 0, min: 0 }, // seconds
    totalTimeYear: { type: Number, default: 0, min: 0 }, // seconds
    totalTimeMonth: { type: Number, default: 0, min: 0 }, // seconds
    totalTimeWeek: { type: Number, default: 0, min: 0 }, // seconds

    totalActivitiesEver: { type: Number, default: 0, min: 0 },
    totalActivitiesYear: { type: Number, default: 0, min: 0 },
    totalActivitiesMonth: { type: Number, default: 0, min: 0 },
    totalActivitiesWeek: { type: Number, default: 0, min: 0 },

    totalElevationEver: { type: Number, default: 0, min: 0 }, // meters
    totalElevationYear: { type: Number, default: 0, min: 0 }, // meters
    totalElevationMonth: { type: Number, default: 0, min: 0 }, // meters
    totalElevationWeek: { type: Number, default: 0, min: 0 }, // meters

    lastUpdated: { type: Date, default: Date.now },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto-update updatedAt on save
UserSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

UserSchema.set("toJSON", {
  transform: transformJsonUser,
});

function transformJsonUser(doc, json, options) {
  delete json.password;
  return json;
}

export default mongoose.model("User", UserSchema);
