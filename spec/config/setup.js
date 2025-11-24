import mongoose from "mongoose";

/**
 * Configuration globale Jest
 * Exécuté une fois avant tous les tests
 */
export default async function globalSetup() {
  // S'assurer que la variable d'environnement est définie
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Se connecter à MongoDB
  await mongoose.connect(process.env.DATABASE_URL);

  // Nettoyer complètement la base de données de test
  await mongoose.connection.dropDatabase();

  console.log("✓ Base de données de test nettoyée");

  // Fermer la connexion proprement
  await mongoose.disconnect();
}
