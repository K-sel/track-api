/**
 * Middleware qui enregistre les informations de base sur chaque requête HTTP.
 */
export default function reqLogger(req, _res, next) {
  console.info(`${req.method} request to "${req.url}" by ${req.hostname}`);
  next();
}
