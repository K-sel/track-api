import User from "../../models/UsersSchema.mjs";

/**
 * Crée un utilisateur de test principal
 * @param {Object} overrides - Propriétés optionnelles pour remplacer les valeurs par défaut
 * @returns {Promise<Object>} L'utilisateur créé
 */
export async function createMainTestUser(overrides = {}) {
  return await User.create({
    username: "testuser",
    email: "test@example.com",
    password: "hashedpassword123",
    firstname: "Test",
    lastname: "User",
    age: 25,
    ...overrides
  });
}

/**
 * Crée un utilisateur secondaire pour les tests d'isolation
 * @param {Object} overrides - Propriétés optionnelles pour remplacer les valeurs par défaut
 * @returns {Promise<Object>} L'utilisateur créé
 */
export async function createSecondaryTestUser(overrides = {}) {
  return await User.create({
    username: "otheruser",
    email: "other@example.com",
    password: "hashedpassword123",
    firstname: "Other",
    lastname: "User",
    age: 30,
    ...overrides
  });
}

/**
 * Templates de données utilisateurs (sans les sauvegarder)
 * Utile pour les tests qui nécessitent des données mais pas de persistence
 */
export const userTemplates = {
  standard: (overrides = {}) => ({
    username: "testuser",
    email: "test@example.com",
    password: "hashedpassword123",
    firstname: "Test",
    lastname: "User",
    age: 25,
    ...overrides
  }),

  secondary: (overrides = {}) => ({
    username: "otheruser",
    email: "other@example.com",
    password: "hashedpassword123",
    firstname: "Other",
    lastname: "User",
    age: 30,
    ...overrides
  }),

  young: (overrides = {}) => ({
    username: "younguser",
    email: "young@example.com",
    password: "hashedpassword123",
    firstname: "Young",
    lastname: "User",
    age: 18,
    ...overrides
  }),

  senior: (overrides = {}) => ({
    username: "senioruser",
    email: "senior@example.com",
    password: "hashedpassword123",
    firstname: "Senior",
    lastname: "User",
    age: 65,
    ...overrides
  })
};
