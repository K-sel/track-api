import { promisify } from "util";
import jwt from "jsonwebtoken";

export const authController = {
  createJWT: async (res, req) => {
    const signJwt = promisify(jwt.sign);
    // Retrieve the secret key from your configuration.
    const secretKey = process.env.SECRET_KEY || "changeme";
    // UNIX timstamp representing a date in 7 days.
    const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
    // Create and sign a token.
    const token = await signJwt({ sub: "userId42", exp: exp }, secretKey);
  },

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
