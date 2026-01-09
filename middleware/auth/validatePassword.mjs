import { sendError, ErrorCodes } from "../../utils/responseFormatter.mjs";

export const validatePassword = (req, res, next) => {
  const password = req.body.password;

  if (!password) {
    return sendError(res, 422, "Le mot de passe est requis", ErrorCodes.VALIDATION_ERROR);
  }

  if (password.length >= 10) {
    next();
  } else {
    return sendError(res, 422, "Le mot de passe doit contenir minimum 10 caractères", ErrorCodes.VALIDATION_ERROR);
  }
};