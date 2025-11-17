import { promisify } from "util";
import jwt from "jsonwebtoken";

const secretKey = process.env.SECRET_KEY;

export const jwtServices = {
  createToken: async (userId) => {
    const signJwt = promisify(jwt.sign);

    const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
    const iat = Math.floor(Date.now() / 1000);

    try {
      const token = await signJwt(
        { sub: userId, exp: exp, iat: iat },
        secretKey
      );
      return token;
    } catch (error) {
      throw new Error(`Failed to create JWT: ${error.message}`);
    }
  },

  verifyToken: async (token) => {
    const verifyJwt = promisify(jwt.verify);

    try {
      const payload = await verifyJwt(token, secretKey);
      return payload;
    } catch (error) {
      throw new Error(`Failed to verify JWT: ${error.message}`);
    }
  },

  refreshToken: async () => {},
};