export const validateFirstname = (req, res, next) => {
  const firstname = req.body.firstname;

  if (!firstname) {
    return res.status(422).json({ message: "Le firstname est requis" });
  }

  if (firstname.length >= 2) {
    next();
  } else {
    return res.status(422).json({
      message: "Le firstname doit contenir minimum 2 caractères",
    });
  }
};
