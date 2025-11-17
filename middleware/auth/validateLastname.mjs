export const validateLastname = (req, res, next) => {
  const lastname = req.body.lastname;

  if (!lastname) {
    return res.status(422).json({ message: "Le lastname est requis" });
  }

  if (lastname.length >= 2) {
    next();
  } else {
    return res.status(422).json({
      message: "Le lastname doit contenir minimum 2 caractères",
    });
  }
};
