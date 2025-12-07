import supertest from "supertest";
import app from "../../../app.mjs";
import User from "../../../models/UsersSchema.mjs";
import Activity from "../../../models/ActivitySchema.mjs";
import { generateValidJwt } from "../../helpers/utils.js";
import { createMainTestUser } from "../../fixtures/userFixtures.js";
import { closeDatabaseConnection } from "../../helpers/database.js";

describe("POST /api/activities", function () {
  let testUser;
  let createdActivities = [];

  beforeAll(async () => {
    // Nettoyer l'utilisateur existant pour éviter les duplications
    await User.deleteOne({ email: "test3@example.com" });

    testUser = await createMainTestUser({
      username: "testuser3",
      email: "test3@example.com"
    });
  });

  afterAll(async () => {
    // Nettoyer toutes les activités créées
    await Activity.deleteMany({ _id: { $in: createdActivities.map(a => a._id) } });

    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }

    // Fermer la connexion à la base de données
    await closeDatabaseConnection();
  });

  it("should create a new activity successfully", async function () {
    const token = await generateValidJwt(testUser);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600 * 1000);

    const activityData = {
      date: now.toISOString(),
      activityType: 'run',
      startedAt: oneHourAgo.toISOString(),
      stoppedAt: now.toISOString(),
      duration: 3600,
      moving_duration: 3500,
      distance: 10000,
      avgSpeed: 10,
      elevationGain: 150,
      elevationLoss: 150,
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
      laps: [
        { elevationGain: 150 }
      ]
    };

    const res = await supertest(app)
      .post("/api/activities")
      .set('Authorization', `Bearer ${token}`)
      .send(activityData)
      .expect(201)
      .expect("Content-Type", /json/);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.userId).toBe(testUser._id.toString());
    expect(res.body.data.activityType).toBe('run');
    expect(res.body.data.distance).toBe(10000);
    expect(res.body.data.weather).toBeDefined();
    expect(res.body.data.difficultyScore).toBeDefined();

    createdActivities.push(res.body.data);
  });

  it("should create activity with all valid activity types", async function () {
    const token = await generateValidJwt(testUser);
    const activityTypes = ['run', 'trail', 'walk', 'cycling', 'hiking', 'other'];

    for (const type of activityTypes) {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600 * 1000);
      const activityData = {
        date: now.toISOString(),
        activityType: type,
        startedAt: oneHourAgo.toISOString(),
        stoppedAt: now.toISOString(),
        duration: 3600,
        moving_duration: 3500,
        distance: 10000,
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
        laps: [
          { elevationGain: 100 }
        ]
      };

      const res = await supertest(app)
        .post("/api/activities")
        .set('Authorization', `Bearer ${token}`)
        .send(activityData)
        .expect(201);

      expect(res.body.data.activityType).toBe(type);
      createdActivities.push(res.body.data);
    }
  });

  it("should return 401 without authentication token", async function () {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600 * 1000);
    const activityData = {
      date: now.toISOString(),
      activityType: 'run',
      startedAt: oneHourAgo.toISOString(),
      stoppedAt: now.toISOString(),
      duration: 3600,
      moving_duration: 3500,
      distance: 10000,
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
      laps: [
        { elevationGain: 100 }
      ]
    };

    await supertest(app)
      .post("/api/activities")
      .send(activityData)
      .expect(401);
  });

  it("should return 400 with missing required fields", async function () {
    const token = await generateValidJwt(testUser);

    const invalidData = {
      activityType: 'run'
      // Manque tous les autres champs requis
    };

    await supertest(app)
      .post("/api/activities")
      .set('Authorization', `Bearer ${token}`)
      .send(invalidData)
      .expect(400);
  });

  it("should return 400 with invalid activity type", async function () {
    const token = await generateValidJwt(testUser);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600 * 1000);

    const invalidData = {
      date: now.toISOString(),
      activityType: 'invalid_type',
      startedAt: oneHourAgo.toISOString(),
      stoppedAt: now.toISOString(),
      duration: 3600,
      moving_duration: 3500,
      distance: 10000,
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
      laps: [
        { elevationGain: 100 }
      ]
    };

    await supertest(app)
      .post("/api/activities")
      .set('Authorization', `Bearer ${token}`)
      .send(invalidData)
      .expect(400);
  });

  it("should return 400 when stoppedAt is before startedAt", async function () {
    const token = await generateValidJwt(testUser);
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 3600 * 1000);

    const invalidData = {
      date: now.toISOString(),
      activityType: 'run',
      startedAt: oneHourLater.toISOString(), // Après stoppedAt
      stoppedAt: now.toISOString(),
      duration: 3600,
      moving_duration: 3500,
      distance: 10000,
      startPosition: {
        timestamp: oneHourLater.toISOString(),
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
      laps: [
        { elevationGain: 100 }
      ]
    };

    await supertest(app)
      .post("/api/activities")
      .set('Authorization', `Bearer ${token}`)
      .send(invalidData)
      .expect(400);
  });

  it("should return 400 with negative distance", async function () {
    const token = await generateValidJwt(testUser);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600 * 1000);

    const invalidData = {
      date: now.toISOString(),
      activityType: 'run',
      startedAt: oneHourAgo.toISOString(),
      stoppedAt: now.toISOString(),
      duration: 3600,
      moving_duration: 3500,
      distance: -1000, // Distance négative invalide
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
      laps: [
        { elevationGain: 100 }
      ]
    };

    await supertest(app)
      .post("/api/activities")
      .set('Authorization', `Bearer ${token}`)
      .send(invalidData)
      .expect(400);
  });

  it("should create activity with optional fields", async function () {
    const token = await generateValidJwt(testUser);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600 * 1000);

    const activityData = {
      date: now.toISOString(),
      activityType: 'run',
      startedAt: oneHourAgo.toISOString(),
      stoppedAt: now.toISOString(),
      duration: 3600,
      moving_duration: 3500,
      distance: 10000,
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
      laps: [
        { elevationGain: 100 }
      ],
      // Champs optionnels
      estimatedCalories: 600,
      avgSpeed: 10.5,
      elevationGain: 100,
      elevationLoss: 90
    };

    const res = await supertest(app)
      .post("/api/activities")
      .set('Authorization', `Bearer ${token}`)
      .send(activityData)
      .expect(201);

    expect(res.body.data.estimatedCalories).toBe(600);
    expect(res.body.data.avgSpeed).toBe(10.5);
    expect(res.body.data.elevationGain).toBe(100);

    createdActivities.push(res.body.data);
  });
});
