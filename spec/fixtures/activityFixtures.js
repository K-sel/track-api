import Activity from "../../models/ActivitySchema.mjs";

/**
 * Crée un ensemble d'activités de test avec différents types et dates
 * @param {Object} userId - L'ID de l'utilisateur propriétaire des activités
 * @param {Date} baseDate - Date de référence (par défaut: maintenant)
 * @returns {Promise<Array>} Tableau des activités créées
 */
export async function createMultipleActivities(userId, baseDate = new Date()) {
  const activities = [];

  // Activité 1: Run récente
  activities.push(await Activity.create({
    userId,
    date: new Date(baseDate.getTime() - 1 * 24 * 3600 * 1000), // il y a 1 jour
    startedAt: new Date(baseDate.getTime() - 1 * 24 * 3600 * 1000 - 3600 * 1000),
    stoppedAt: new Date(baseDate.getTime() - 1 * 24 * 3600 * 1000),
    duration: 3600,
    moving_duration: 3500,
    distance: 10000,
    avgPace: 10,
    elevationGain: 150,
    elevationLoss: 150,
    startPosition: {
      geometry: { type: 'Point', coordinates: [6.6323, 46.5197] }
    },
    endPosition: {
      geometry: { type: 'Point', coordinates: [6.6423, 46.5297] }
    }
  }));

  // Activité 2: Cycling plus ancienne
  activities.push(await Activity.create({
    userId,
    date: new Date(baseDate.getTime() - 7 * 24 * 3600 * 1000), // il y a 7 jours
    startedAt: new Date(baseDate.getTime() - 7 * 24 * 3600 * 1000 - 5400 * 1000),
    stoppedAt: new Date(baseDate.getTime() - 7 * 24 * 3600 * 1000),
    duration: 5400,
    moving_duration: 5200,
    distance: 30000,
    avgPace: 20,
    elevationGain: 300,
    elevationLoss: 300,
    startPosition: {
      geometry: { type: 'Point', coordinates: [6.6323, 46.5197] }
    },
    endPosition: {
      geometry: { type: 'Point', coordinates: [6.6523, 46.5497] }
    }
  }));

  // Activité 3: Trail encore plus ancienne avec courte distance
  activities.push(await Activity.create({
    userId,
    date: new Date(baseDate.getTime() - 14 * 24 * 3600 * 1000), // il y a 14 jours
    startedAt: new Date(baseDate.getTime() - 14 * 24 * 3600 * 1000 - 7200 * 1000),
    stoppedAt: new Date(baseDate.getTime() - 14 * 24 * 3600 * 1000),
    duration: 7200,
    moving_duration: 7000,
    distance: 15000,
    avgPace: 7.5,
    elevationGain: 800,
    elevationLoss: 800,
    startPosition: {
      geometry: { type: 'Point', coordinates: [6.6323, 46.5197] }
    },
    endPosition: {
      geometry: { type: 'Point', coordinates: [6.6323, 46.5197] }
    }
  }));

  return activities;
}

/**
 * Crée une activité walk simple pour un autre utilisateur
 * @param {Object} userId - L'ID de l'utilisateur propriétaire de l'activité
 * @param {Date} baseDate - Date de référence (par défaut: maintenant)
 * @returns {Promise<Object>} L'activité créée
 */
export async function createSimpleWalkActivity(userId, baseDate = new Date()) {
  return await Activity.create({
    userId,
    date: baseDate,
    startedAt: new Date(baseDate.getTime() - 1800 * 1000),
    stoppedAt: baseDate,
    duration: 1800,
    moving_duration: 1800,
    distance: 3000,
    avgPace: 6,
    startPosition: {
      geometry: { type: 'Point', coordinates: [6.6323, 46.5197] }
    },
    endPosition: {
      geometry: { type: 'Point', coordinates: [6.6423, 46.5297] }
    }
  });
}

/**
 * Templates de données d'activités (sans les sauvegarder)
 * Utile pour les tests qui nécessitent des données mais pas de persistence
 */
export const activityTemplates = {
  run: (userId, overrides = {}) => ({
    userId,
    date: new Date(),
    startedAt: new Date(Date.now() - 3600 * 1000),
    stoppedAt: new Date(),
    duration: 3600,
    moving_duration: 3500,
    distance: 10000,
    avgPace: 10,
    elevationGain: 150,
    elevationLoss: 150,
    startPosition: {
      geometry: { type: 'Point', coordinates: [6.6323, 46.5197] }
    },
    endPosition: {
      geometry: { type: 'Point', coordinates: [6.6423, 46.5297] }
    },
    ...overrides
  }),

  cycling: (userId, overrides = {}) => ({
    userId,
    date: new Date(),
    startedAt: new Date(Date.now() - 5400 * 1000),
    stoppedAt: new Date(),
    duration: 5400,
    moving_duration: 5200,
    distance: 30000,
    avgPace: 20,
    elevationGain: 300,
    elevationLoss: 300,
    startPosition: {
      geometry: { type: 'Point', coordinates: [6.6323, 46.5197] }
    },
    endPosition: {
      geometry: { type: 'Point', coordinates: [6.6523, 46.5497] }
    },
    ...overrides
  }),

  trail: (userId, overrides = {}) => ({
    userId,
    date: new Date(),
    startedAt: new Date(Date.now() - 7200 * 1000),
    stoppedAt: new Date(),
    duration: 7200,
    moving_duration: 7000,
    distance: 15000,
    avgPace: 7.5,
    elevationGain: 800,
    elevationLoss: 800,
    startPosition: {
      geometry: { type: 'Point', coordinates: [6.6323, 46.5197] }
    },
    endPosition: {
      geometry: { type: 'Point', coordinates: [6.6323, 46.5197] }
    },
    ...overrides
  }),

  walk: (userId, overrides = {}) => ({
    userId,
    date: new Date(),
    startedAt: new Date(Date.now() - 1800 * 1000),
    stoppedAt: new Date(),
    duration: 1800,
    moving_duration: 1800,
    distance: 3000,
    avgPace: 6,
    startPosition: {
      geometry: { type: 'Point', coordinates: [6.6323, 46.5197] }
    },
    endPosition: {
      geometry: { type: 'Point', coordinates: [6.6423, 46.5297] }
    },
    ...overrides
  })
};
