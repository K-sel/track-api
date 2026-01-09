import { sendError, ErrorCodes } from "../../utils/responseFormatter.mjs";

// Regex complète pour validation d'email selon RFC 5322
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Validation commune
export const validateEmail = (req, res, next) => {
  const email = req.body.email;

  if (!email) {
    return sendError(res, 422, "L'email est requis", ErrorCodes.VALIDATION_ERROR);
  }

  if (EMAIL_REGEX.test(email)) {
    next();
  } else {
    return sendError(res, 422, "Veuillez entrer une adresse mail valide", ErrorCodes.VALIDATION_ERROR);
  }
};