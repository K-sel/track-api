import supertest from "supertest";
import mongoose from "mongoose";
import app from "../../../app.mjs";
import User from "../../../models/UsersSchema.mjs";
import Activity from "../../../models/ActivitySchema.mjs";
import { generateValidJwt, createTestActivity } from "../../helpers/utils.js";
import { createMainTestUser, createSecondaryTestUser } from "../../fixtures/userFixtures.js";
import { closeDatabaseConnection } from "../../helpers/database.js";

describe("GET /api/activities/:id", function () {
  let testUser;
  let otherUser;
  let userActivity;
  let otherUserActivity;

  beforeAll(async () => {
    // Créer deux utilisateurs de test
    testUser = await createMainTestUser({
      username: "testuser2",
      email: "test2@example.com"
    });
    otherUser = await createSecondaryTestUser();

    // Créer une activité pour chaque utilisateur
    userActivity = await createTestActivity(testUser);
    otherUserActivity = await createTestActivity(otherUser);
  });

  afterAll(async () => {
    // Nettoyer les données de test
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

  it("should get user's own activity successfully", async function () {
    const token = await generateValidJwt(testUser);

    const res = await supertest(app)
      .get(`/api/activities/${userActivity._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(userActivity._id.toString());
    expect(res.body.data.userId).toBe(testUser._id.toString());
  });

  it("should not get another user's activity", async function () {
    const token = await generateValidJwt(testUser);

    await supertest(app)
      .get(`/api/activities/${otherUserActivity._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it("should return 401 without token", async function () {
    await supertest(app)
      .get(`/api/activities/${userActivity._id}`)
      .expect(401);
  });

  it("should return 404 for non-existent activity", async function () {
    const token = await generateValidJwt(testUser);
    const fakeId = new mongoose.Types.ObjectId();

    await supertest(app)
      .get(`/api/activities/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it("should return 400 for invalid ObjectId", async function () {
    const token = await generateValidJwt(testUser);

    await supertest(app)
      .get('/api/activities/invalid-id')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });
});
