export const authController = {
  createUser: async (res, req) => {
    try {
      const user = req.body;
      const result = await createJWT();

      if (result) {
        res.status(201).json({
          success: true,
          message: "Utilisateur ajouté avec succès",
          id: result,
        });
      }
    } catch (error) {
      let statusCode;

      if (error instanceof Error) {
        statusCode =
          error.message ===
          "Format de l'utilisateur invalide pour l'insertion en base de données"
            ? 400
            : 500;
      } else {
        statusCode = 500;
      }

      res.status(statusCode).json({
        success: false,
        message: "Erreur lors de l'ajout de l'utilisateur",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  login() {},
};
