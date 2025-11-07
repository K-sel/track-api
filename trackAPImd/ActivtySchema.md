const ActivitySchema = new Schema({
  _id: ObjectId,
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Basic Info
  date: { type: Date, required: true },
  activityType: { 
    type: String, 
    required: true,
    enum: ['run', 'trail', 'walk', 'cycling', 'hiking', 'other']
  },
  
  // Timing
  startedAt: { type: Date, required: true },
  stoppedAt: { type: Date, required: true },
  duration: { type: Number, required: true }, 
  moving_duration: { type: Number, required: true }, // seconds (net duration, pauses excluded)
  
  // Distance
  distance: { type: Number, required: true }, // meters
  avgSpeed: Number, // km/h
  
  // Elevation
  elevationGain: Number, // meters (positive)
  elevationLoss: Number, // meters (negative)
  altitude_max: Number, // meters
  altitude_min: Number, // meters
  altitude_avg: Number, // meters
  
  // Position (start & end)
  startPosition: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  endPosition: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  
 // Lien vers GPS Trace (optionnel car toutes les activités n'ont pas forcément de trace p.ex activité rentrée a la main ou mec qui refuse la loc)
  gpsTraceId: { 
    type: Schema.Types.ObjectId, 
    ref: 'ActivityTraceGPS',
    default: null  // null si pas de trace GPS
  },
  
  // Medias (videos?/photos) (embedded - URLs or paths)
  medias: [{
    url: String, // Cloud storage URL
    latitude: Number,
    longitude: Number,
    timestamp: Date,
    kmMark: Number // km parcouru au moment de la photo
  }],
  
  // Weather Enrichment (auto-fetched by backend)
  weather: {
    temperature: Number, // °C
    humidity: Number, // %
    windSpeed: Number, // km/h
    conditions: String, // 'sunny', 'rainy', 'cloudy', etc.
    fetchedAt: Date
  },
  
  // Difficulty Score (auto-calculated)
  difficultyScore: {
    type: Number,
    default: 1.0,
    min: 1.0,
    max: 2.0
  },
  // Difficulty breakdown
  difficultyFactors: {
    baseScore: { type: Number, default: 1.0 },
    elevationBonus: { type: Number, default: 0 },
    weatherBonus: { type: Number, default: 0 },
    windBonus: { type: Number, default: 0 },
    temperatureBonus: { type: Number, default: 0 }
  },
  
  // Optional fields
  notes: String,
  feeling: { type: String, enum: ['great', 'good', 'ok', 'tired', 'poor'] },
  
  // Calories (estimated)
  estimatedCalories: Number,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});