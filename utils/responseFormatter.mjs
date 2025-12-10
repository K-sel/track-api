/**
 * Utilitaire pour formater les réponses de l'API de manière standardisée
 * @module responseFormatter
 */

/**
 * Formate une réponse de succès
 * @param {Object} res - Objet response Express
 * @param {number} statusCode - Code de statut HTTP
 * @param {any} data - Données à retourner
 * @param {Object} meta - Métadonnées optionnelles (pagination, etc.)
 * @returns {Object} Réponse JSON formatée
 */
export const sendSuccess = (res, statusCode = 200, data = null, meta = null) => {
  const response = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Formate une réponse d'erreur
 * @param {Object} res - Objet response Express
 * @param {number} statusCode - Code de statut HTTP
 * @param {string} message - Message d'erreur
 * @param {string} code - Code d'erreur (ex: ERR_XXX)
 * @param {Array} details - Détails supplémentaires de l'erreur
 * @returns {Object} Réponse JSON formatée
 */
export const sendError = (res, statusCode = 500, message = "Une erreur est survenue", code = "ERR_INTERNAL", details = []) => {
  const response = {
    success: false,
    error: {
      message,
      code,
    },
  };

  if (details && details.length > 0) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Codes d'erreur standardisés
 */
export const ErrorCodes = {
  // Erreurs d'authentification (401)
  UNAUTHORIZED: "ERR_UNAUTHORIZED",
  INVALID_CREDENTIALS: "ERR_INVALID_CREDENTIALS",
  INVALID_TOKEN: "ERR_INVALID_TOKEN",

  // Erreurs de permission (403)
  FORBIDDEN: "ERR_FORBIDDEN",

  // Erreurs de ressource (404)
  NOT_FOUND: "ERR_NOT_FOUND",
  ACTIVITY_NOT_FOUND: "ERR_ACTIVITY_NOT_FOUND",
  USER_NOT_FOUND: "ERR_USER_NOT_FOUND",
  MEDIA_NOT_FOUND: "ERR_MEDIA_NOT_FOUND",

  // Erreurs de validation (400, 422)
  VALIDATION_ERROR: "ERR_VALIDATION",
  INVALID_ID: "ERR_INVALID_ID",
  MISSING_FIELDS: "ERR_MISSING_FIELDS",
  INVALID_FORMAT: "ERR_INVALID_FORMAT",

  // Erreurs de conflit (409)
  CONFLICT: "ERR_CONFLICT",
  EMAIL_EXISTS: "ERR_EMAIL_EXISTS",
  DUPLICATE_RESOURCE: "ERR_DUPLICATE_RESOURCE",

  // Erreurs de limite (400)
  LIMIT_EXCEEDED: "ERR_LIMIT_EXCEEDED",

  // Erreurs serveur (500)
  INTERNAL_ERROR: "ERR_INTERNAL",
  DATABASE_ERROR: "ERR_DATABASE",
};
