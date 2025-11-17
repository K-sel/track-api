import bcrypt from "bcrypt";
import User from "../models/UsersSchema.mjs";
import { jwtServices } from "../services/jwtServices.mjs";

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
        firstname: req.body.firstname,
        lastname: req.body.lastname,
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
        message: error.message,
      });
    }
  },

  login: async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });

      if (!user) {
        throw new Error("Email ou mot de passe incorrect");
      }

      const valid = await bcrypt.compare(req.body.password, user.password);
      if (!valid) {
        throw new Error("Email ou mot de passe incorrect");
      }

      const token = await jwtServices.createToken(user._id.toString());

      res.status(200).json({ token });
    } catch (error) {
      let statusCode = 500;

      if (error.message === "Email ou mot de passe incorrect") {
        statusCode = 401;
      }

      res.status(statusCode).json({
        message: error.message,
      });
    }
  },
};
