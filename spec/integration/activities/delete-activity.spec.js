import supertest from "supertest";
import mongoose from "mongoose";
import app from "../../../app.mjs";
import User from "../../../models/UsersSchema.mjs";
import Activity from "../../../models/ActivitySchema.mjs";
import { generateValidJwt, createTestActivity } from "../../helpers/utils.js";
import { createMainTestUser, createSecondaryTestUser } from "../../fixtures/userFixtures.js";
import { closeDatabaseConnection } from "../../helpers/database.js";

describe("DELETE /api/activities/:id", function () {
  let testUser;
  let otherUser;

  beforeAll(async () => {
    // Nettoyer les utilisateurs existants pour éviter les duplications
    await User.deleteOne({ email: "test5@example.com" });
    await User.deleteOne({ email: "other5@example.com" });

    testUser = await createMainTestUser({
      username: "testuser5",
      email: "test5@example.com"
    });
    otherUser = await createSecondaryTestUser({
      username: "otheruser5",
      email: "other5@example.com"
    });
  });

  afterAll(async () => {
    // Nettoyer tous les utilisateurs et activités restantes
    await Activity.deleteMany({ userId: { $in: [testUser._id, otherUser._id] } });

    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }
    if (otherUser) {
      await User.findByIdAndDelete(otherUser._id);
    }

    // Fermer la connexion à la base de données
    await closeDatabaseConnection();
  });

  it("should delete user's own activity successfully", async function () {
    const activity = await createTestActivity(testUser);
    const token = await generateValidJwt(testUser);

    const res = await supertest(app)
      .delete(`/api/activities/${activity._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBeDefined();

    // Vérifier que l'activité a bien été supprimée
    const deletedActivity = await Activity.findById(activity._id);
    expect(deletedActivity).toBeNull();
  });

  it("should not delete another user's activity", async function () {
    const otherActivity = await createTestActivity(otherUser);
    const token = await generateValidJwt(testUser);

    await supertest(app)
      .delete(`/api/activities/${otherActivity._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    // Vérifier que l'activité existe toujours
    const stillExists = await Activity.findById(otherActivity._id);
    expect(stillExists).not.toBeNull();

    // Nettoyer
    await Activity.findByIdAndDelete(otherActivity._id);
  });

  it("should return 401 without authentication token", async function () {
    const activity = await createTestActivity(testUser);

    await supertest(app)
      .delete(`/api/activities/${activity._id}`)
      .expect(401);

    // Nettoyer
    await Activity.findByIdAndDelete(activity._id);
  });

  it("should return 404 for non-existent activity", async function () {
    const token = await generateValidJwt(testUser);
    const fakeId = new mongoose.Types.ObjectId();

    await supertest(app)
      .delete(`/api/activities/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it("should return 400 for invalid ObjectId", async function () {
    const token = await generateValidJwt(testUser);

    await supertest(app)
      .delete('/api/activities/invalid-id')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it("should return 404 when trying to delete already deleted activity", async function () {
    const activity = await createTestActivity(testUser);
    const token = await generateValidJwt(testUser);

    // Première suppression - devrait réussir
    await supertest(app)
      .delete(`/api/activities/${activity._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Deuxième suppression - devrait échouer
    await supertest(app)
      .delete(`/api/activities/${activity._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it("should delete multiple activities independently", async function () {
    const token = await generateValidJwt(testUser);

    // Créer 3 activités
    const activity1 = await createTestActivity(testUser);
    const activity2 = await createTestActivity(testUser);
    const activity3 = await createTestActivity(testUser);

    // Supprimer la première
    await supertest(app)
      .delete(`/api/activities/${activity1._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Vérifier que seule la première a été supprimée
    const deleted = await Activity.findById(activity1._id);
    expect(deleted).toBeNull();

    const exists2 = await Activity.findById(activity2._id);
    expect(exists2).not.toBeNull();

    const exists3 = await Activity.findById(activity3._id);
    expect(exists3).not.toBeNull();

    // Nettoyer les activités restantes
    await Activity.findByIdAndDelete(activity2._id);
    await Activity.findByIdAndDelete(activity3._id);
  });
});
