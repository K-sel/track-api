import supertest from "supertest";
import app from "../../../app.mjs";
import User from "../../../models/UsersSchema.mjs";
import Activity from "../../../models/ActivitySchema.mjs";
import { generateValidJwt } from "../../helpers/utils.js";
import { createMainTestUser } from "../../fixtures/userFixtures.js";
import { closeDatabaseConnection } from "../../helpers/database.js";

describe("POST /api/activities - Extended validation tests", function () {
  let testUser;
  let createdActivities = [];

  beforeAll(async () => {
    await User.deleteOne({ email: "createactivity-extended@example.com" });
    testUser = await createMainTestUser({
      email: "createactivity-extended@example.com"
    });
  });

  afterAll(async () => {
    await Activity.deleteMany({ _id: { $in: createdActivities.map(a => a._id) } });
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }
    await closeDatabaseConnection();
  });

  it("should return 400 when startPosition format is invalid", async function () {
    const token = await generateValidJwt(testUser);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600 * 1000);

    const activityData = {
      date: now.toISOString(),
      startedAt: oneHourAgo.toISOString(),
      stoppedAt: now.toISOString(),
      duration: 3600,
      moving_duration: 3500,
      distance: 10000,
      avgPace: 10,
      elevationGain: 150,
      elevationLoss: 150,
      altitude_min: 400,
      altitude_max: 550,
      altitude_avg: 475,
      startPosition: {
        // Invalid format - missing geometry or coordinates
        timestamp: oneHourAgo.toISOString(),
      },
      endPosition: {
        timestamp: now.toISOString(),
        geometry: {
          type: 'Point',
          coordinates: [6.6423, 46.5297]
        }
      },
      encodedPolyline: 'u~w~Fs~{tE??AA',
      totalPoints: 100,
      samplingRate: 1,
      estimatedCalories: 500,
      laps: []
    };

    const res = await supertest(app)
      .post("/api/activities")
      .set('Authorization', `Bearer ${token}`)
      .send(activityData)
      .expect(400)
      .expect("Content-Type", /json/);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain("startPosition invalide");
  });

  it("should return 400 when endPosition format is invalid", async function () {
    const token = await generateValidJwt(testUser);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600 * 1000);

    const activityData = {
      date: now.toISOString(),
      startedAt: oneHourAgo.toISOString(),
      stoppedAt: now.toISOString(),
      duration: 3600,
      moving_duration: 3500,
      distance: 10000,
      avgPace: 10,
      elevationGain: 150,
      elevationLoss: 150,
      altitude_min: 400,
      altitude_max: 550,
      altitude_avg: 475,
      startPosition: {
        timestamp: oneHourAgo.toISOString(),
        geometry: {
          type: 'Point',
          coordinates: [6.6323, 46.5197]
        }
      },
      endPosition: {
        // Invalid format - coordinates has only 1 element
        timestamp: now.toISOString(),
        geometry: {
          type: 'Point',
          coordinates: [6.6423]
        }
      },
      encodedPolyline: 'u~w~Fs~{tE??AA',
      totalPoints: 100,
      samplingRate: 1,
      estimatedCalories: 500,
      laps: []
    };

    const res = await supertest(app)
      .post("/api/activities")
      .set('Authorization', `Bearer ${token}`)
      .send(activityData)
      .expect(400)
      .expect("Content-Type", /json/);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain("endPosition invalide");
  });

  it("should return 400 when stoppedAt is before startedAt", async function () {
    const token = await generateValidJwt(testUser);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600 * 1000);

    const activityData = {
      date: now.toISOString(),
      startedAt: now.toISOString(), // After stoppedAt
      stoppedAt: oneHourAgo.toISOString(), // Before startedAt
      duration: 3600,
      moving_duration: 3500,
      distance: 10000,
      avgPace: 10,
      elevationGain: 150,
      elevationLoss: 150,
      altitude_min: 400,
      altitude_max: 550,
      altitude_avg: 475,
      startPosition: {
        timestamp: oneHourAgo.toISOString(),
        geometry: {
          type: 'Point',
          coordinates: [6.6323, 46.5197]
        }
      },
      endPosition: {
        timestamp: now.toISOString(),
        geometry: {
          type: 'Point',
          coordinates: [6.6423, 46.5297]
        }
      },
      encodedPolyline: 'u~w~Fs~{tE??AA',
      totalPoints: 100,
      samplingRate: 1,
      estimatedCalories: 500,
      laps: []
    };

    const res = await supertest(app)
      .post("/api/activities")
      .set('Authorization', `Bearer ${token}`)
      .send(activityData)
      .expect(400)
      .expect("Content-Type", /json/);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain("validation");
  });
});
