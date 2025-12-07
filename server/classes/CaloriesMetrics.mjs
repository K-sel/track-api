/**
 * CaloriesMetrics - Calculates calories burned during activity
 * Uses MET (Metabolic Equivalent of Task) values based on speed
 * Adjusts for elevation gain to account for increased effort
 */
export default class CaloriesMetrics {
  #MET = [
    { speed: 3, met: 2.3 }, // Marche très lente
    { speed: 3.5, met: 2.8 }, // Marche lente
    { speed: 4, met: 3.0 }, // Marche normale
    { speed: 4.5, met: 3.5 }, // Marche rapide
    { speed: 5, met: 4.0 }, // Marche très rapide
    { speed: 5.5, met: 5.0 }, // Transition marche/jogging
    { speed: 6, met: 6.0 }, // Jogging très léger
    { speed: 6.5, met: 6.5 }, // Jogging léger
    { speed: 7, met: 7.0 }, // Jogging
    { speed: 7.5, met: 7.5 }, // Jogging modéré
    { speed: 8, met: 8.3 }, // Course légère
    { speed: 8.5, met: 9.0 }, // Course modérée
    { speed: 9, met: 9.8 }, // Course
    { speed: 9.5, met: 10.5 }, // Course soutenue
    { speed: 10, met: 11.0 }, // Course rapide
    { speed: 10.5, met: 11.5 },
    { speed: 11, met: 12.3 }, // Course très rapide
    { speed: 12, met: 12.8 },
    { speed: 13, met: 13.5 }, // Course intense
    { speed: 14, met: 14.0 },
    { speed: 15, met: 14.5 }, // Sprint modéré
    { speed: 16, met: 16.0 }, // Sprint
    { speed: 18, met: 18.0 }, // Sprint rapide
    { speed: 20, met: 19.8 }, // Sprint très rapide
  ];

  #ELEVATION_FACTOR = 0.5;
  #ROUND = 0.5;
  #totalCalories = 0;

  /**
   * Find the MET value for a given speed using interpolation
   * @param {number} speed - Speed in km/h
   * @returns {number} MET value
   * @private
   */
  #findMETForSpeed(speed) {
    if (speed >= 20) {
      return 19.8;
    } else if (speed <= 3) {
      return 2.3;
    }

    // Round speed for lookup
    const roundedSpeed = Math.round(speed / this.#ROUND) * this.#ROUND;

    // Try exact match first
    for (const entry of this.#MET) {
      if (entry.speed === roundedSpeed) {
        return entry.met;
      }
    }

    // If no exact match, interpolate between two closest values
    for (let i = 0; i < this.#MET.length - 1; i++) {
      if (speed >= this.#MET[i].speed && speed < this.#MET[i + 1].speed) {
        const lower = this.#MET[i];
        const upper = this.#MET[i + 1];
        const ratio = (speed - lower.speed) / (upper.speed - lower.speed);
        return lower.met + ratio * (upper.met - lower.met);
      }
    }

    return 2.3; // Default fallback
  }

  /**
   * Calculate MET value adjusted for elevation gain
   * @param {number} avgSpeed - Average speed in km/h
   * @param {number} elevationGain - Total elevation gain in meters
   * @param {number} distance - Total distance in meters
   * @returns {number} Adjusted MET value
   */
  calculateAdjustedMET(avgSpeed, elevationGain, distance) {
    if (!avgSpeed || !distance || distance === 0) {
      return 0;
    }

    const baseMET = this.#findMETForSpeed(avgSpeed);

    // Adjust MET for elevation: add factor based on elevation gain per 100m
    const elevationAdjustment = (elevationGain / distance) * 100 * this.#ELEVATION_FACTOR;

    return baseMET + elevationAdjustment;
  }

  /**
   * Calculate calories burned during a segment
   * @param {number} avgSpeed - Average speed in km/h
   * @param {number} elevationGain - Elevation gain in meters
   * @param {number} distance - Distance in meters
   * @param {number} duration - Duration in milliseconds
   * @param {number} weight - User weight in kg
   * @returns {number} Calories burned
   */
  calculateCalories(avgSpeed, elevationGain, distance, duration, weight) {
    if (!duration || !weight) {
      return 0;
    }

    const adjustedMET = this.calculateAdjustedMET(avgSpeed, elevationGain, distance);

    // Convert duration from ms to minutes
    const durationMinutes = duration / 60000;

    // Formula: Calories/min = (MET × 3.5 × weight) / 200
    const caloriesPerMinute = (adjustedMET * 3.5 * weight) / 200;

    return caloriesPerMinute * durationMinutes;
  }

  /**
   * Add calories from a segment to the total
   * @param {number} calories - Calories to add
   */
  addCalories(calories) {
    this.#totalCalories += calories;
  }

  /**
   * Get total calories burned
   * @returns {number} Total calories
   */
  getTotalCalories() {
    return this.#totalCalories;
  }

  /**
   * Reset calorie tracking
   */
  reset() {
    this.#totalCalories = 0;
  }
}
