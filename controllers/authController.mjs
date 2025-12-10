import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "../models/UsersSchema.mjs";
import Activity from "../models/ActivitySchema.mjs";
import BestPerformances from "../models/BestPerformancesSchema.mjs";
import YearlyStats from "../models/stats/YearlyStatsSchema.mjs";
import MonthlyStats from "../models/stats/MonthlyStatsSchema.mjs";
import WeeklyStats from "../models/stats/WeeklyStatsSchema.mjs";
import { jwtServices } from "../services/jwtServices.mjs";
import { sendSuccess, sendError, ErrorCodes } from "../utils/responseFormatter.mjs";

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

      return sendSuccess(res, 201, {
        message: "Utilisateur ajouté avec succès",
        id: result._id,
      });
    } catch (error) {
      if (error.message.includes("already associated")) {
        return sendError(res, 409, error.message, ErrorCodes.EMAIL_EXISTS);
      }
      return sendError(res, 500, error.message, ErrorCodes.INTERNAL_ERROR);
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

      return sendSuccess(res, 200, { token });
    } catch (error) {
      if (error.message === "Email ou mot de passe incorrect") {
        return sendError(res, 401, error.message, ErrorCodes.INVALID_CREDENTIALS);
      }
      return sendError(res, 500, error.message, ErrorCodes.INTERNAL_ERROR);
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
          return sendError(
            res,
            422,
            "Le mot de passe doit contenir au moins 10 caractères",
            ErrorCodes.VALIDATION_ERROR
          );
        }
        if (!currentPassword) {
          throw new Error("Le mot de passe actuel est requis");
        }
        const costFactor = 10;
        updateData.password = await bcrypt.hash(password, costFactor);
      }

      if (Object.keys(updateData).length === 0) {
        return sendError(
          res,
          400,
          "Aucune modification à effectuer",
          ErrorCodes.VALIDATION_ERROR
        );
      }

      await User.findByIdAndUpdate(userId, updateData);

      return sendSuccess(res, 200, {
        message: "Identifiants mis à jour avec succès",
      });
    } catch (error) {
      if (error.message.includes("non trouvé")) {
        return sendError(res, 404, error.message, ErrorCodes.USER_NOT_FOUND);
      } else if (
        error.message.includes("incorrect") ||
        error.message.includes("requis")
      ) {
        return sendError(res, 401, error.message, ErrorCodes.INVALID_CREDENTIALS);
      } else if (error.message.includes("déjà associé")) {
        return sendError(res, 409, error.message, ErrorCodes.EMAIL_EXISTS);
      }
      return sendError(res, 500, error.message, ErrorCodes.INTERNAL_ERROR);
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

      return sendSuccess(res, 200, {
        message: "Compte supprimé avec succès",
      });
    } catch (error) {
      if (error.message.includes("non trouvé")) {
        return sendError(res, 404, error.message, ErrorCodes.USER_NOT_FOUND);
      } else if (
        error.message.includes("incorrect") ||
        error.message.includes("requis")
      ) {
        return sendError(res, 401, error.message, ErrorCodes.INVALID_CREDENTIALS);
      }
      return sendError(res, 500, error.message, ErrorCodes.INTERNAL_ERROR);
    }
  },
};
