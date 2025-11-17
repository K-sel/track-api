/**
 * Middleware qui valide les informations de connexion dans la requête.
 *
 * @remarks
 * - Vérifie que l'email et le mot de passe sont présents dans la requête.
 * - Valide également le format de l'adresse email.
 * - Renvoie une erreur 422 si la validation échoue, avec des détails sur le format attendu.
 */
export const validateLoginRequestBody = (req, res, next) => {
  const email = req.body.email;
  const passowrd = req.body.password;

  if (passowrd && email && isValidEmail(email)) {
    next();
  } else {
    res.status(422).json({
      success: false,
      message:
        "La demande de connexion ne contient pas les données attendues ou leur format est incorrect.",
      error: "Validation échouée",
      formatAttendu: `{
      "email" :string "xxx@xxx.xx",
      "password" :string
      }`,
    });
    return;
  }
};

/**
 * Middleware qui valide le format de l'adresse email dans la requête.
 *
 * @remarks
 * - Vérifie que l'adresse email est dans un format valide si elle est présente.
 * - Ignore la validation si aucun email n'est fourni.
 * - Renvoie une erreur 400 si l'email n'est pas valide, avec des détails sur le format attendu.
 */
export const validateMail = (req, res, next) => {
  const email = req.body.email;

  if (email) {
    if (isValidEmail(email)) {
      res.status(400).json({
        success: false,
        message: "Ceci n'est pas une adresse mail",
        error: "Validation échouée",
        formatAttendu: "xxx@xxx.xx",
      });
      return;
    } else {
      next();
    }
  } else {
    next();
  }
};

function isValidEmail(email) {
  // Regex complète pour validation d'email selon RFC 5322
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}
