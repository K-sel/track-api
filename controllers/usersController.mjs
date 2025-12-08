import YearlyStatsSchema from "../models/stats/YearlyStatsSchema.mjs";
import MonthlyStatsSchema from "../models/stats/MonthlyStatsSchema.mjs";
import WeeklyStatsSchema from "../models/stats/WeeklyStatsSchema.mjs";
import UsersSchema from "../models/UsersSchema.mjs";

export const usersController = {
  getYearlyStats: async (req, res, next) => {
    try {
      const userId = req.currentUserId;
      const yearlyStats = await YearlyStatsSchema.find({ userId });
      res.status(200).json({ data: yearlyStats });
    } catch (error) {
      res.status(500).json({
        error: error,
      });
    }
  },

  getMonthlyStats: async (req, res, next) => {
    try {
      const userId = req.currentUserId;
      const monthlyStats = await MonthlyStatsSchema.find({ userId });
      res.status(200).json({ data: monthlyStats });
    } catch (error) {
      res.status(500).json({
        error: error,
      });
    }
  },

  getWeeklyStats: async (req, res, next) => {
    try {
      const userId = req.currentUserId;
      const weeklyStats = await WeeklyStatsSchema.find({ userId });
      res.status(200).json({ data: weeklyStats });
    } catch (error) {
      res.status(500).json({
        error: error,
      });
    }
  },

  getUserInfos: async (req, res, next) => {
    try {
      const userId = req.currentUserId;
      const userInfos = await UsersSchema.findById(userId);
      res.status(200).json({ data: userInfos });
    } catch (error) {
      res.status(500).json({
        error: error,
      });
    }
  },

  updateUserInfos: async (req, res, next) => {},
};
