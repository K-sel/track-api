import { promisify } from "util";
import jwt from "jsonwebtoken";

const secretKey = process.env.SECRET_KEY;

const createToken = async (userId) => {
  const signJwt = promisify(jwt.sign);
  // Retrieve the secret key from your configuration.

  // UNIX timstamp representing a date in 7 days.
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
  const iat = Math.floor(Date.now() / 1000);

  try {
    // Create and sign a token.
    const token = await signJwt({ sub: userId, exp: exp, iat: iat }, secretKey);
    return token;
  } catch (error) {
    throw new Error(`Failed to create JWT: ${error.message}`);
  }
};

const verifyToken = async (token) => {
  const verifyJwt = promisify(jwt.verify);

  try {
    const payload = await verifyJwt(token, secretKey);  
    console.log(payload);
  } catch (error) {
    throw new Error(`Failed to create JWT: ${error.message}`);
  }
};

const refreshToken = async () => {};

export default { createToken, verifyToken, refreshToken };
