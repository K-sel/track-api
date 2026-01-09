import supertest from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import app from "../../../app.mjs";
import User from "../../../models/UsersSchema.mjs";
import Activity from "../../../models/ActivitySchema.mjs";
import BestPerformances from "../../../models/BestPerformancesSchema.mjs";
import YearlyStats from "../../../models/stats/YearlyStatsSchema.mjs";
import MonthlyStats from "../../../models/stats/MonthlyStatsSchema.mjs";
import WeeklyStats from "../../../models/stats/WeeklyStatsSchema.mjs";
import { jwtServices } from "../../../services/jwtServices.mjs";
import { closeDatabaseConnection } from "../../helpers/database.js";

describe("DELETE /api/auth/delete-account", function () {
  let testUserId;
  let testUserToken;

  beforeEach(async () => {
    await mongoose.connection;

    // Clean up before each test
    await User.deleteOne({ email: "delete-test@example.com" });

    const user = await User.create({
      username: "deleteuser",
      email: "delete-test@example.com",
      password: await bcrypt.hash("testpassword123", 10),
      firstname: "Test",
      lastname: "User"
    });

    testUserId = user._id.toString();
    testUserToken = await jwtServices.createToken(testUserId);

    // Create related data
    const now = new Date();
    await Activity.create({
      userId: testUserId,
      name: "Test Activity",
      distance: 5000,
      duration: 1800,
      moving_duration: 1800,
      sport: "running",
      date: now,
      startedAt: now,
      stoppedAt: new Date(now.getTime() + 1800000),
      avgPace: "6:00",
      elevationGain: 0,
      elevationLoss: 0,
      altitude_min: 100,
      altitude_max: 100,
      altitude_avg: 100,
      startPosition: {
        timestamp: now,
        geometry: {
          type: "Point",
          coordinates: [0, 0]
        }
      },
      endPosition: {
        timestamp: now,
        geometry: {
          type: "Point",
          coordinates: [0, 0]
        }
      },
      encodedPolyline: "test",
      totalPoints: 10,
      samplingRate: 1,
      estimatedCalories: 100,
      laps: []
    });

    await BestPerformances.create({
      userId: testUserId,
      distance: 5000,
      bestPerformance: {
        chrono: 1800,
        date: new Date(),
        activityId: new mongoose.Types.ObjectId()
      },
      performanceHistory: []
    });

    await YearlyStats.create({
      userId: testUserId,
      year: 2026,
      totalKm: 5,
      totalActivities: 1,
      totalTime: 1800,
      totalElevation: 0
    });

    await MonthlyStats.create({
      userId: testUserId,
      year: 2026,
      month: 1,
      totalKm: 5,
      totalActivities: 1,
      totalTime: 1800,
      totalElevation: 0
    });

    await WeeklyStats.create({
      userId: testUserId,
      year: 2026,
      week: 1,
      month: 1,
      totalKm: 5,
      totalActivities: 1,
      totalTime: 1800,
      totalElevation: 0
    });
  }, 10000);

  afterAll(async () => {
    await User.deleteOne({ email: "delete-test@example.com" });
    await closeDatabaseConnection();
  }, 10000);


  it("should return 401 when password is incorrect", async function () {
    const response = await supertest(app)
      .delete("/api/auth/delete-account")
      .set("Authorization", `Bearer ${testUserToken}`)
      .send({
        password: "wrongpassword123",
      })
      .expect(401)
      .expect("Content-Type", /json/);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toContain("incorrect");

    // Verify user was NOT deleted
    const user = await User.findById(testUserId);
    expect(user).not.toBeNull();
  });

  it("should return 422 when password is missing", async function () {
    const response = await supertest(app)
      .delete("/api/auth/delete-account")
      .set("Authorization", `Bearer ${testUserToken}`)
      .send({})
      .expect(422)
      .expect("Content-Type", /json/);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toContain("requis");

    // Verify user was NOT deleted
    const user = await User.findById(testUserId);
    expect(user).not.toBeNull();
  });

  it("should return 401 when no token is provided", async function () {
    const response = await supertest(app)
      .delete("/api/auth/delete-account")
      .send({
        password: "testpassword123",
      })
      .expect(401)
      .expect("Content-Type", /json/);

    expect(response.body.message).toBeDefined();

    // Verify user was NOT deleted
    const user = await User.findById(testUserId);
    expect(user).not.toBeNull();
  });

  it("should return 422 when password is too short", async function () {
    const response = await supertest(app)
      .delete("/api/auth/delete-account")
      .set("Authorization", `Bearer ${testUserToken}`)
      .send({
        password: "short",
      })
      .expect(422)
      .expect("Content-Type", /json/);

    expect(response.body.success).toBe(false);

    // Verify user was NOT deleted
    const user = await User.findById(testUserId);
    expect(user).not.toBeNull();
  });
});
