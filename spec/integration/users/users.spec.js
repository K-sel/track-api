import supertest from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import app from "../../../app.mjs";
import User from "../../../models/UsersSchema.mjs";
import YearlyStats from "../../../models/stats/YearlyStatsSchema.mjs";
import MonthlyStats from "../../../models/stats/MonthlyStatsSchema.mjs";
import WeeklyStats from "../../../models/stats/WeeklyStatsSchema.mjs";
import BestPerformances from "../../../models/BestPerformancesSchema.mjs";
import { jwtServices } from "../../../services/jwtServices.mjs";
import { closeDatabaseConnection } from "../../helpers/database.js";

describe("Users Controller", function () {
  let testUserId;
  let testUserToken;

  beforeAll(async () => {
    await mongoose.connection;
    await User.deleteOne({ email: "users-test@example.com" });

    const user = await User.create({
      username: "userstest",
      email: "users-test@example.com",
      password: await bcrypt.hash("password123", 10),
      firstname: "Test",
      lastname: "User"
    });

    testUserId = user._id.toString();
    testUserToken = await jwtServices.createToken(testUserId);

    // Create stats for testing
    await YearlyStats.create({
      userId: testUserId,
      year: 2026,
      totalKm: 100,
      totalActivities: 10,
      totalTime: 36000,
      totalElevation: 500
    });

    await YearlyStats.create({
      userId: testUserId,
      year: 2025,
      totalKm: 50,
      totalActivities: 5,
      totalTime: 18000,
      totalElevation: 250
    });

    await MonthlyStats.create({
      userId: testUserId,
      year: 2026,
      month: 1,
      totalKm: 25,
      totalActivities: 3,
      totalTime: 9000,
      totalElevation: 100
    });

    await WeeklyStats.create({
      userId: testUserId,
      year: 2026,
      week: 1,
      month: 1,
      totalKm: 10,
      totalActivities: 1,
      totalTime: 3600,
      totalElevation: 50
    });

    await BestPerformances.create({
      userId: testUserId,
      distance: 5000,
      bestPerformance: {
        chrono: 1200,
        date: new Date(),
        activityId: new mongoose.Types.ObjectId()
      },
      performanceHistory: []
    });
  });

  afterAll(async () => {
    await User.deleteOne({ email: "users-test@example.com" });
    await YearlyStats.deleteMany({ userId: testUserId });
    await MonthlyStats.deleteMany({ userId: testUserId });
    await WeeklyStats.deleteMany({ userId: testUserId });
    await BestPerformances.deleteMany({ userId: testUserId });
    await closeDatabaseConnection();
  });

  describe("GET /api/users/user", function () {
    it("should return 200 and user information", async function () {
      const response = await supertest(app)
        .get("/api/users/user")
        .set("Authorization", `Bearer ${testUserToken}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        username: "userstest",
        email: "users-test@example.com",
        firstname: "Test",
        lastname: "User"
      });
      expect(response.body.data.password).toBeUndefined();
    });

    it("should return 401 when no token is provided", async function () {
      const response = await supertest(app)
        .get("/api/users/user")
        .expect(401)
        .expect("Content-Type", /json/);

      expect(response.body.message).toBeDefined();
    });
  });

  describe("GET /api/users/yearly", function () {
    it("should return 200 and yearly stats", async function () {
      const response = await supertest(app)
        .get("/api/users/yearly")
        .set("Authorization", `Bearer ${testUserToken}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      const stats2026 = response.body.data.find(s => s.year === 2026);
      expect(stats2026).toBeDefined();
      expect(stats2026.totalKm).toBe(100);
      expect(stats2026.totalActivities).toBe(10);
    });

    it("should return 401 when no token is provided", async function () {
      const response = await supertest(app)
        .get("/api/users/yearly")
        .expect(401)
        .expect("Content-Type", /json/);

      expect(response.body.message).toBeDefined();
    });
  });

  describe("GET /api/users/monthly", function () {
    it("should return 200 and monthly stats", async function () {
      const response = await supertest(app)
        .get("/api/users/monthly")
        .set("Authorization", `Bearer ${testUserToken}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);

      const stats = response.body.data.find(s => s.year === 2026 && s.month === 1);
      expect(stats).toBeDefined();
      expect(stats.totalKm).toBe(25);
      expect(stats.totalActivities).toBe(3);
    });

    it("should return 401 when no token is provided", async function () {
      const response = await supertest(app)
        .get("/api/users/monthly")
        .expect(401)
        .expect("Content-Type", /json/);

      expect(response.body.message).toBeDefined();
    });
  });

  describe("GET /api/users/weekly", function () {
    it("should return 200 and weekly stats", async function () {
      const response = await supertest(app)
        .get("/api/users/weekly")
        .set("Authorization", `Bearer ${testUserToken}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);

      const stats = response.body.data.find(s => s.year === 2026 && s.week === 1);
      expect(stats).toBeDefined();
      expect(stats.totalKm).toBe(10);
      expect(stats.totalActivities).toBe(1);
    });

    it("should return 401 when no token is provided", async function () {
      const response = await supertest(app)
        .get("/api/users/weekly")
        .expect(401)
        .expect("Content-Type", /json/);

      expect(response.body.message).toBeDefined();
    });
  });

  describe("GET /api/users/best-performances", function () {
    it("should return 200 and best performances", async function () {
      const response = await supertest(app)
        .get("/api/users/best-performances")
        .set("Authorization", `Bearer ${testUserToken}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);

      const perf = response.body.data[0];
      expect(perf.distance).toBe(5000);
    });

    it("should return 401 when no token is provided", async function () {
      const response = await supertest(app)
        .get("/api/users/best-performances")
        .expect(401)
        .expect("Content-Type", /json/);

      expect(response.body.message).toBeDefined();
    });
  });
});
