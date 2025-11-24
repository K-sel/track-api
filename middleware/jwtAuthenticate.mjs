import { jwtServices } from "../services/jwtServices.mjs";

export const jwtAuthenticate = async (req, res, next) => {

  const authorization = req.get('Authorization');
  if (!authorization) {
    return res.status(401).json({ message: "Authorization header is missing" });
  }
  
  const match = authorization.match(/^Bearer (.+)$/);
  if (!match) {
    return res.status(401).json({ message: "Authorization header is not a bearer token" });
  }
  
  const token = match[1];
  
  try {
    const payload = await jwtServices.verifyToken(token);
    req.currentUserId = payload.sub;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Your token is invalid or has expired" });
  }
};