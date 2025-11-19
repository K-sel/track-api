import jwt from "jsonwebtoken";
import { promisify } from "util";

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
