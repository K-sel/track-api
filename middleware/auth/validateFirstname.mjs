import { sendError, ErrorCodes } from "../../utils/responseFormatter.mjs";

export const validateFirstname = (req, res, next) => {
  const firstname = req.body.firstname;

  if (!firstname) {
    return sendError(res, 422, "Le firstname est requis", ErrorCodes.VALIDATION_ERROR);
  }

  if (firstname.length >= 2) {
    next();
  } else {
    return sendError(res, 422, "Le firstname doit contenir minimum 2 caractères", ErrorCodes.VALIDATION_ERROR);
  }
};
