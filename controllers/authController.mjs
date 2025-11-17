import bcrypt from "bcrypt";
import User from "../models/UsersSchema.mjs";

export const authController = {
  createUser: async (req, res) => {
    try {
      const emailExists = await User.findOne({ email: req.body.email });
      console.log(emailExists);

      if (emailExists) {
        throw new Error(
          "This Email is already associated with an existing account"
        );
      }

      const costFactor = 10;
      const hashedPassword = await bcrypt.hash(req.body.password, costFactor);

      const result = await User.create({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
      });

      res.status(201).json({
        success: true,
        message: "Utilisateur ajouté avec succès",
        id: result._id,
      });

    } catch (error) {
      let statusCode;
      if (error.message.includes("already associated")) {
        statusCode = 409;
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

  login: async (res, req) => {
    // // Attempt to find a user with the provided name
    // const user = await User.findOne({ name: req.body.name });
    // if (!user) return res.sendStatus(401); // user not found

    // // Compare the provided password with the stored hashed password
    // const valid = await bcrypt.compare(req.body.password, user.password);
    // if (!valid) return res.sendStatus(401); // wrong password

    // // Define JWT expiration: current time + 1 week (in seconds)
    // const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
    // // Create the payload for the JWT including the user ID and expiration

    // const payload = { sub: user._id.toString(), exp: exp };
    // // Sign the JWT and send it to the client

    // const token = await signJwt(payload, secretKey);
    // res.send({ token });
  },
};
