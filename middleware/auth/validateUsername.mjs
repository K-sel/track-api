export const validateUsername = (req, res, next) => {
  const username = req.body.username;

  if (!username) {
    return res.status(422).json({ message: "Le username est requis" });
  }

  if (username.length >= 2) {
    next();
  } else {
    return res.status(422).json({
      message: "Le username doit contenir minimum 2 caractères",
    });
  }
};
