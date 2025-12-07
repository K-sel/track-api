import mongoose from "mongoose";
const { Schema } = mongoose;

const ActivitySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  // Basic Info
  date: { type: Date, required: true, index: true },
  activityType: {
    type: String,
    required: true,
    enum: ["run", "trail", "walk", "cycling", "hiking", "other"],
  },

  // Timing
  startedAt: { type: Date, required: true },
  stoppedAt: { type: Date, required: true },
  duration: { type: Number, required: true, min: 0 }, // seconds
  moving_duration: { type: Number, required: true, min: 0 }, // seconds (net duration, pauses excluded)

  // Distance
  distance: { type: Number, required: true, min: 0 }, // meters
  avgSpeed: { type: Number, min: 0 }, // km/h

  // Elevation
  elevationGain: { type: Number, min: 0 }, // meters (positive)
  elevationLoss: { type: Number, min: 0 }, // meters (positive value)
  altitude_max: Number, // meters
  altitude_min: Number, // meters
  altitude_avg: Number, // meters

  // Position (start & end) - with geospatial index
  startPosition: {
    geometry: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [longitude, latitude, altitude?]
    },
    timestamp: { type: Date },
    altitude: Number, // altitude en mètres
  },
  endPosition: {
    geometry: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [longitude, latitude, altitude?]
    },
    timestamp: { type: Date },
    altitude: Number, // altitude en mètres
  },

  encodedPolyline: { type: String, default: null }, // "u~w~Fs~{tE??AA..." - String compressée (50% plus léger)
  totalPoints: { type: Number, default: 0, min: 0 },
  samplingRate: { type: Number, default: 1, min: 0.1, max: 60 }, // 1 = 1 point/sec

  // Medias (videos?/photos) - URLs Cloudinary uniquement (max 10)
  medias: {
    type: [
      {
        type: String, // URL Cloudinary
      },
    ],
    validate: {
      validator: function (arr) {
        return arr.length <= 10;
      },
      message: "Un maximum de 10 médias est autorisé par activité",
    },
  },

  // Weather Enrichment (auto-fetched by backend)
  weather: {
    temperature: Number, // °C
    humidity: { type: Number, min: 0, max: 100 }, // %
    windSpeed: { type: Number, min: 0 }, // km/h
    conditions: String, // 'sunny', 'rainy', 'cloudy', etc.
    fetchedAt: Date,
  },

  // Difficulty Score (auto-calculated)
  difficultyScore: {
    type: Number,
    default: 1.0,
    min: 1.0,
    max: 2.0,
  },
  // Difficulty breakdown
  difficultyFactors: {
    baseScore: {
      type: Number,
      default: 1.0,
    },
    elevationBonus: { type: Number, default: 0, min: 0 },
    weatherBonus: { type: Number, default: 0, min: 0 },
    windBonus: { type: Number, default: 0, min: 0 },
    temperatureBonus: { type: Number, default: 0, min: 0 },
  },

  // Calories (estimated)
  estimatedCalories: { type: Number, min: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Compound index for efficient queries by user and date
ActivitySchema.index({ userId: 1, date: -1 });

// Geospatial indexes for location-based queries
ActivitySchema.index({ "startPosition.geometry": "2dsphere" });
ActivitySchema.index({ "endPosition.geometry": "2dsphere" });

// Index for filtering by activity type
ActivitySchema.index({ activityType: 1 });

// Validation: stoppedAt must be after startedAt
ActivitySchema.pre("validate", function (next) {
  if (this.stoppedAt <= this.startedAt) {
    next(new Error("stoppedAt must be after startedAt"));
  } else {
    next();
  }
});

// Auto-update updatedAt on save
ActivitySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Auto-update createdAt on save
ActivitySchema.pre("save", function (next) {
  this.createdAt = Date.now();
  next();
});

export default mongoose.model("Activity", ActivitySchema);
