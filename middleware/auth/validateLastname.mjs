import { sendError, ErrorCodes } from "../../utils/responseFormatter.mjs";

export const validateLastname = (req, res, next) => {
  const lastname = req.body.lastname;

  if (!lastname) {
    return sendError(res, 422, "Le lastname est requis", ErrorCodes.VALIDATION_ERROR);
  }

  if (lastname.length >= 2) {
    next();
  } else {
    return sendError(res, 422, "Le lastname doit contenir minimum 2 caractères", ErrorCodes.VALIDATION_ERROR);
  }
};
