import { sendError, ErrorCodes } from "../../utils/responseFormatter.mjs";

export const validateUsername = (req, res, next) => {
  const username = req.body.username;

  if (!username) {
    return sendError(res, 422, "Le username est requis", ErrorCodes.VALIDATION_ERROR);
  }

  if (username.length >= 2) {
    next();
  } else {
    return sendError(res, 422, "Le username doit contenir minimum 2 caractères", ErrorCodes.VALIDATION_ERROR);
  }
};
