import supertest from "supertest";
import mongoose from "mongoose";
import app from "../../../app.mjs";
import User from "../../../models/UsersSchema.mjs";
import Activity from "../../../models/ActivitySchema.mjs";
import { generateValidJwt, createTestActivity } from "../../helpers/utils.js";
import { createMainTestUser, createSecondaryTestUser } from "../../fixtures/userFixtures.js";
import { closeDatabaseConnection } from "../../helpers/database.js";

describe("PATCH /api/activities/:id", function () {
  let testUser;
  let otherUser;
  let userActivity;
  let otherUserActivity;

  beforeAll(async () => {
    testUser = await createMainTestUser({
      username: "testuser4",
      email: "test4@example.com"
    });
    otherUser = await createSecondaryTestUser({
      username: "otheruser4",
      email: "other4@example.com"
    });

    userActivity = await createTestActivity(testUser);
    otherUserActivity = await createTestActivity(otherUser);
  });

  afterAll(async () => {
    if (userActivity) {
      await Activity.findByIdAndDelete(userActivity._id);
    }
    if (otherUserActivity) {
      await Activity.findByIdAndDelete(otherUserActivity._id);
    }
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }
    if (otherUser) {
      await User.findByIdAndDelete(otherUser._id);
    }

    // Fermer la connexion à la base de données
    await closeDatabaseConnection();
  });

  it("should update user's own activity successfully", async function () {
    const token = await generateValidJwt(testUser);

    const updateData = {
      notes: "Activité mise à jour",
      feeling: "great"
    };

    const res = await supertest(app)
      .patch(`/api/activities/${userActivity._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body.success).toBe(true);
    expect(res.body.data.notes).toBe("Activité mise à jour");
    expect(res.body.data.feeling).toBe("great");
  });

  it("should update activity elevation fields", async function () {
    const token = await generateValidJwt(testUser);

    const updateData = {
      elevationGain: 200,
      elevationLoss: 180
    };

    const res = await supertest(app)
      .patch(`/api/activities/${userActivity._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200);

    expect(res.body.data.elevationGain).toBe(200);
    expect(res.body.data.elevationLoss).toBe(180);
  });

  it("should not update another user's activity", async function () {
    const token = await generateValidJwt(testUser);

    const updateData = {
      notes: "Tentative de modification"
    };

    await supertest(app)
      .patch(`/api/activities/${otherUserActivity._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(403);
  });

  it("should return 401 without authentication token", async function () {
    const updateData = {
      notes: "Tentative sans token"
    };

    await supertest(app)
      .patch(`/api/activities/${userActivity._id}`)
      .send(updateData)
      .expect(401);
  });

  it("should return 404 for non-existent activity", async function () {
    const token = await generateValidJwt(testUser);
    const fakeId = new mongoose.Types.ObjectId();

    const updateData = {
      notes: "Test"
    };

    await supertest(app)
      .patch(`/api/activities/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(404);
  });

  it("should return 400 for invalid ObjectId", async function () {
    const token = await generateValidJwt(testUser);

    const updateData = {
      notes: "Test"
    };

    await supertest(app)
      .patch('/api/activities/invalid-id')
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(400);
  });

  it("should return 400 when trying to set invalid activity type", async function () {
    const token = await generateValidJwt(testUser);

    const updateData = {
      activityType: 'invalid_type'
    };

    await supertest(app)
      .patch(`/api/activities/${userActivity._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(400);
  });

  it("should return 400 with negative distance", async function () {
    const token = await generateValidJwt(testUser);

    const updateData = {
      distance: -5000
    };

    await supertest(app)
      .patch(`/api/activities/${userActivity._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(400);
  });

  it("should allow partial updates", async function () {
    const token = await generateValidJwt(testUser);

    // Mise à jour uniquement des notes
    const updateData = {
      notes: "Seulement les notes"
    };

    const res = await supertest(app)
      .patch(`/api/activities/${userActivity._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200);

    expect(res.body.data.notes).toBe("Seulement les notes");
    // Les autres champs restent inchangés
    expect(res.body.data.activityType).toBe('run');
  });

  it("should return 400 when trying to update with only non-modifiable fields", async function () {
    const token = await generateValidJwt(testUser);
    const newUserId = new mongoose.Types.ObjectId();

    // Essayer de modifier uniquement des champs non-modifiables
    const updateData = {
      userId: newUserId.toString(),
      distance: 5000,
      duration: 3600
    };

    const res = await supertest(app)
      .patch(`/api/activities/${userActivity._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    // Devrait retourner 400 car aucun champ modifiable n'est fourni
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
