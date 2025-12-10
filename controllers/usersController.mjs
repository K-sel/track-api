import YearlyStatsSchema from "../models/stats/YearlyStatsSchema.mjs";
import MonthlyStatsSchema from "../models/stats/MonthlyStatsSchema.mjs";
import WeeklyStatsSchema from "../models/stats/WeeklyStatsSchema.mjs";
import UsersSchema from "../models/UsersSchema.mjs";
import BestPerformancesSchema from "../models/BestPerformancesSchema.mjs";
import { sendSuccess, sendError, ErrorCodes } from "../utils/responseFormatter.mjs";

export const usersController = {
  getYearlyStats: async (req, res, next) => {
    try {
      const userId = req.currentUserId;
      const yearlyStats = await YearlyStatsSchema.find({ userId });
      return sendSuccess(res, 200, yearlyStats);
    } catch (error) {
      return sendError(res, 500, error.message, ErrorCodes.INTERNAL_ERROR);
    }
  },

  getMonthlyStats: async (req, res, next) => {
    try {
      const userId = req.currentUserId;
      const monthlyStats = await MonthlyStatsSchema.find({ userId });
      return sendSuccess(res, 200, monthlyStats);
    } catch (error) {
      return sendError(res, 500, error.message, ErrorCodes.INTERNAL_ERROR);
    }
  },

  getWeeklyStats: async (req, res, next) => {
    try {
      const userId = req.currentUserId;
      const weeklyStats = await WeeklyStatsSchema.find({ userId });
      return sendSuccess(res, 200, weeklyStats);
    } catch (error) {
      return sendError(res, 500, error.message, ErrorCodes.INTERNAL_ERROR);
    }
  },

  getUserInfos: async (req, res, next) => {
    try {
      const userId = req.currentUserId;
      const userInfos = await UsersSchema.findById(userId);
      return sendSuccess(res, 200, userInfos);
    } catch (error) {
      return sendError(res, 500, error.message, ErrorCodes.INTERNAL_ERROR);
    }
  },

  getBestPerformances: async (req, res, next) => {
    try {
      const userId = req.currentUserId;
      const bestPerformances = await BestPerformancesSchema.find({ userId });
      return sendSuccess(res, 200, bestPerformances);
    } catch (error) {
      return sendError(res, 500, error.message, ErrorCodes.INTERNAL_ERROR);
    }
  },
};
