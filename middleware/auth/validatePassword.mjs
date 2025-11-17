export const validatePassword = (req, res, next) => {
  const password = req.body.password;

  if (!password) {
    return res.status(422).json({ message: "Le mot de passe est requis" });
  }

  if (password.length >= 10) {
    next();
  } else {
    return res.status(422).json({
      message: "Le mot de passe doit contenir minimum 10 caractères",
    });
  }
};