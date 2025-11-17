// Regex complète pour validation d'email selon RFC 5322
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Validation commune
export const validateEmail = (req, res, next) => {
  const email = req.body.email;

  if (!email) {
    return res.status(422).json({ message: "L'email est requis" });
  }

  if (EMAIL_REGEX.test(email)) {
    next();
  } else {
    return res.status(422).json({
      message: "Veuillez entrer une adresse mail valide",
    });
  }
};