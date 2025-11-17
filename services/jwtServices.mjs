import { promisify } from "util";
import jwt from "jsonwebtoken";

const createToken = async () => {
  const signJwt = promisify(jwt.sign);
  // Retrieve the secret key from your configuration.
  const secretKey = process.env.SECRET_KEY || "changeme";
  // UNIX timstamp representing a date in 7 days.
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
  // Create and sign a token.
  const token = await signJwt({ sub: "userId42", exp: exp }, secretKey);
};

const verifyToken = async () => {};

const refreshToken = async () => {};


export default {createToken, verifyToken, refreshToken}
