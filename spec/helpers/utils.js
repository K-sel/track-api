import jwt from "jsonwebtoken";
import { promisify } from "util";
import Activity from "../../models/ActivitySchema.mjs";

const signJwt = promisify(jwt.sign);

/**
 * Génère un JWT valide pour les tests
 * @param {Object} user - L'utilisateur pour lequel générer le token
 * @returns {Promise<string>} Le token JWT signé
 */
export function generateValidJwt(user) {
  // Génère un JWT valide qui expire dans 7 jours
  const exp = Math.floor((new Date().getTime() + 7 * 24 * 3600 * 1000) / 1000);

  const claims = {
    sub: user._id.toString(),
    exp: exp
  };
  return signJwt(claims, process.env.SECRET_KEY);
}

/**
 * Génère un JWT expiré pour les tests
 * @param {Object} user - L'utilisateur pour lequel générer le token
 * @returns {Promise<string>} Le token JWT signé
 */
export function generateExpiredJwt(user) {
  // Génère un JWT valide qui est expiré
  const exp = Math.floor((new Date().getTime() - 7 * 24 * 3600 * 1000) / 1000);
  
  const claims = {
    sub: user._id.toString(),
    exp: exp
  };
  return signJwt(claims, process.env.SECRET_KEY);
}

/**
 * Crée une activité de test dans la base de données
 * @param {Object} user - L'utilisateur propriétaire de l'activité
 * @param {Object} overrides - Propriétés optionnelles pour remplacer les valeurs par défaut
 * @returns {Promise<Object>} L'activité créée
 */
export async function createTestActivity(user, overrides = {}) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600 * 1000);

  const defaults = {
    userId: user._id,
    date: now,
    activityType: 'run',
    startedAt: oneHourAgo,
    stoppedAt: now,
    duration: 3600,
    moving_duration: 3500,
    distance: 10000,
    avgSpeed: 10,
    elevationGain: 150,
    elevationLoss: 150,
    startPosition: {
      geometry: {
        type: 'Point',
        coordinates: [6.6323, 46.5197] // Lausanne
      }
    },
    endPosition: {
      geometry: {
        type: 'Point',
        coordinates: [6.6423, 46.5297]
      }
    }
  };

  return await Activity.create({ ...defaults, ...overrides });
}
