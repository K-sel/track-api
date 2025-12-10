import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "../models/UsersSchema.mjs";
import Activity from "../models/ActivitySchema.mjs";
import BestPerformances from "../models/BestPerformancesSchema.mjs";
import YearlyStats from "../models/stats/YearlyStatsSchema.mjs";
import MonthlyStats from "../models/stats/MonthlyStatsSchema.mjs";
import WeeklyStats from "../models/stats/WeeklyStatsSchema.mjs";
import { jwtServices } from "../services/jwtServices.mjs";

export const authController = {
  createUser: async (req, res) => {
    try {
      const emailExists = await User.findOne({ email: req.body.email });

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

      const userId = result._id;

      await YearlyStats.create({
        userId : userId,
        year: currentYear,
        totalKm: 0,
        totalActivities: 0,
        totalTime: 0,
        totalElevation: 0,
      });

      // ✅ Initialiser MonthlyStats
      await MonthlyStats.create({
        userId : userId,
        year: currentYear,
        month: currentMonth,
        totalKm: 0,
        totalActivities: 0,
        totalTime: 0,
        totalElevation: 0,
      });

      // ✅ Initialiser WeeklyStats
      await WeeklyStats.create({
        userId : userId,
        year: currentYear,
        week: currentWeek,
        totalKm: 0,
        totalActivities: 0,
        totalTime: 0,
        totalElevation: 0,
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

  updateUserCredentials: async (req, res) => {
    try {
      const userId = req.currentUserId;
      const { email, password, currentPassword } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        throw new Error("Utilisateur non trouvé");
      }

      if (currentPassword) {
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
          throw new Error("Mot de passe actuel incorrect");
        }
      }

      const updateData = {};

      if (email && email !== user.email) {
        const emailExists = await User.findOne({ email, _id: { $ne: userId } });
        if (emailExists) {
          throw new Error("Cet email est déjà associé à un autre compte");
        }
        updateData.email = email;
      }

      if (password) {
        if (password.length < 10) {
          return res.status(422).json({
            message: "Le mot de passe doit contenir au moins 10 caractères",
          });
        }
        if (!currentPassword) {
          throw new Error("Le mot de passe actuel est requis");
        }
        const costFactor = 10;
        updateData.password = await bcrypt.hash(password, costFactor);
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Aucune modification à effectuer",
        });
      }

      await User.findByIdAndUpdate(userId, updateData);

      res.status(200).json({
        success: true,
        message: "Identifiants mis à jour avec succès",
      });
    } catch (error) {
      let statusCode = 500;

      if (error.message.includes("non trouvé")) {
        statusCode = 404;
      } else if (
        error.message.includes("incorrect") ||
        error.message.includes("requis")
      ) {
        statusCode = 401;
      } else if (error.message.includes("déjà associé")) {
        statusCode = 409;
      }

      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const userId = req.currentUserId;
      const { password } = req.body;

      if (!password) {
        throw new Error("Le mot de passe est requis pour supprimer le compte");
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error("Utilisateur non trouvé");
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        throw new Error("Mot de passe incorrect");
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        await Activity.deleteMany({ userId }).session(session);
        await BestPerformances.deleteMany({ userId }).session(session);
        await YearlyStats.deleteMany({ userId }).session(session);
        await MonthlyStats.deleteMany({ userId }).session(session);
        await WeeklyStats.deleteMany({ userId }).session(session);
        await user.deleteOne().session(session);

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }

      res.status(200).json({
        success: true,
        message: "Compte supprimé avec succès",
      });
    } catch (error) {
      let statusCode = 500;

      if (error.message.includes("non trouvé")) {
        statusCode = 404;
      } else if (
        error.message.includes("incorrect") ||
        error.message.includes("requis")
      ) {
        statusCode = 401;
      }

      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  },
};
