import mongoose from "mongoose";

/**
 * Ferme la connexion MongoDB de manière propre
 * À utiliser dans afterAll() de chaque fichier de test
 *
 * @returns {Promise<void>}
 *
 * @example
 * afterAll(async () => {
 *   // Nettoyer les données de test
 *   await Activity.deleteMany({ userId: testUser._id });
 *
 *   // Fermer la connexion
 *   await closeDatabaseConnection();
 * });
 */
export async function closeDatabaseConnection() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

/**
 * Vérifie que la connexion MongoDB est établie
 * Utile pour le débogage
 *
 * @returns {boolean} true si connecté, false sinon
 */
export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}
