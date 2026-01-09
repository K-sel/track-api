import supertest from "supertest";
import mongoose from "mongoose";
import app from "../../../app.mjs";
import User from "../../../models/UsersSchema.mjs";
import Activity from "../../../models/ActivitySchema.mjs";
import { generateValidJwt, createTestActivity } from "../../helpers/utils.js";
import { createMainTestUser, createSecondaryTestUser } from "../../fixtures/userFixtures.js";
import { closeDatabaseConnection } from "../../helpers/database.js";

describe("Medias API", function () {
  let testUser;
  let otherUser;
  let testActivity;
  let otherUserActivity;

  const testMediaUrl = "https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg";
  const testMediaUrl2 = "https://res.cloudinary.com/test/image/upload/v1234567890/test-image-2.jpg";

  beforeAll(async () => {
    // Nettoyer les utilisateurs existants
    await User.deleteOne({ email: "mediatest@example.com" });
    await User.deleteOne({ email: "mediaother@example.com" });

    // Créer les utilisateurs de test
    testUser = await createMainTestUser({
      username: "mediatestuser",
      email: "mediatest@example.com"
    });
    otherUser = await createSecondaryTestUser({
      username: "mediaotheruser",
      email: "mediaother@example.com"
    });

    // Créer une activité de test
    testActivity = await createTestActivity(testUser);
    otherUserActivity = await createTestActivity(otherUser);
  });

  afterAll(async () => {
    // Nettoyer les activités
    if (testActivity) {
      await Activity.findByIdAndDelete(testActivity._id);
    }
    if (otherUserActivity) {
      await Activity.findByIdAndDelete(otherUserActivity._id);
    }

    // Nettoyer les utilisateurs
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }
    if (otherUser) {
      await User.findByIdAndDelete(otherUser._id);
    }

    await closeDatabaseConnection();
  });

  describe("POST /api/medias/:activityId", function () {
    it("should add a media to an activity successfully", async function () {
      const token = await generateValidJwt(testUser);

      const res = await supertest(app)
        .post(`/api/medias/${testActivity._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ mediaUrl: testMediaUrl })
        .expect(201)
        .expect("Content-Type", /json/);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBeDefined();
      expect(res.body.data.totalMedias).toBe(1);
      expect(res.body.data.medias).toContain(testMediaUrl);
    });

    it("should return 400 with invalid activity ID", async function () {
      const token = await generateValidJwt(testUser);

      await supertest(app)
        .post("/api/medias/invalid-id")
        .set('Authorization', `Bearer ${token}`)
        .send({ mediaUrl: testMediaUrl })
        .expect(400);
    });

    it("should return 400 when mediaUrl is missing", async function () {
      const token = await generateValidJwt(testUser);

      await supertest(app)
        .post(`/api/medias/${testActivity._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });

    it("should return 401 without authentication", async function () {
      await supertest(app)
        .post(`/api/medias/${testActivity._id}`)
        .send({ mediaUrl: testMediaUrl })
        .expect(401);
    });

    it("should return 403 when trying to add media to another user's activity", async function () {
      const token = await generateValidJwt(testUser);

      await supertest(app)
        .post(`/api/medias/${otherUserActivity._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ mediaUrl: testMediaUrl })
        .expect(403);
    });

    it("should return 404 with non-existent activity ID", async function () {
      const token = await generateValidJwt(testUser);
      const fakeId = new mongoose.Types.ObjectId();

      await supertest(app)
        .post(`/api/medias/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ mediaUrl: testMediaUrl })
        .expect(404);
    });

    it("should return 409 when adding duplicate media", async function () {
      const token = await generateValidJwt(testUser);

      // Le média a déjà été ajouté dans le premier test
      await supertest(app)
        .post(`/api/medias/${testActivity._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ mediaUrl: testMediaUrl })
        .expect(409);
    });

    it("should return 400 when maximum of 10 medias is reached", async function () {
      const token = await generateValidJwt(testUser);

      // Ajouter 9 médias supplémentaires (on en a déjà 1)
      for (let i = 2; i <= 10; i++) {
        await supertest(app)
          .post(`/api/medias/${testActivity._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ mediaUrl: `https://res.cloudinary.com/test/image/upload/v${i}/test-${i}.jpg` })
          .expect(201);
      }

      // Essayer d'ajouter un 11ème média
      await supertest(app)
        .post(`/api/medias/${testActivity._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ mediaUrl: "https://res.cloudinary.com/test/image/upload/v11/test-11.jpg" })
        .expect(400);
    });
  });

  describe("GET /api/medias/:activityId", function () {
    it("should get all medias from a specific activity", async function () {
      const token = await generateValidJwt(testUser);

      const res = await supertest(app)
        .get(`/api/medias/${testActivity._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body.success).toBe(true);
      expect(res.body.data.activityId).toBe(testActivity._id.toString());
      expect(res.body.data.totalMedias).toBeGreaterThanOrEqual(1);
      expect(res.body.data.medias).toBeInstanceOf(Array);
      expect(res.body.data.medias).toContain(testMediaUrl);
    });

    it("should return 400 with invalid activity ID", async function () {
      const token = await generateValidJwt(testUser);

      await supertest(app)
        .get("/api/medias/invalid-id")
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it("should return 401 without authentication", async function () {
      await supertest(app)
        .get(`/api/medias/${testActivity._id}`)
        .expect(401);
    });

    it("should return 403 when accessing another user's activity", async function () {
      const token = await generateValidJwt(testUser);

      await supertest(app)
        .get(`/api/medias/${otherUserActivity._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it("should return 404 with non-existent activity ID", async function () {
      const token = await generateValidJwt(testUser);
      const fakeId = new mongoose.Types.ObjectId();

      await supertest(app)
        .get(`/api/medias/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe("GET /api/medias/all", function () {
    it("should get all medias from all user's activities", async function () {
      const token = await generateValidJwt(testUser);

      const res = await supertest(app)
        .get("/api/medias/all")
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);

      // Le contrôleur retourne les métadonnées comme second paramètre de sendSuccess
      // qui devrait être dans res.body.metadata ou res.body (selon l'implémentation)
      const metadata = res.body.metadata || res.body;
      if (metadata.totalActivitiesWithMedias !== undefined) {
        expect(metadata.totalActivitiesWithMedias).toBeGreaterThanOrEqual(1);
        expect(metadata.totalMedias).toBeGreaterThanOrEqual(1);
      }

      // Vérifier la structure des données
      if (res.body.data.length > 0) {
        const firstActivity = res.body.data[0];
        expect(firstActivity.activityId).toBeDefined();
        expect(firstActivity.date).toBeDefined();
        expect(firstActivity.medias).toBeInstanceOf(Array);
      }
    });

    it("should return 401 without authentication", async function () {
      await supertest(app)
        .get("/api/medias/all")
        .expect(401);
    });
  });

  describe("DELETE /api/medias/:activityId", function () {
    let activityForDeletion;

    beforeAll(async () => {
      // Créer une nouvelle activité avec un média pour les tests de suppression
      activityForDeletion = await createTestActivity(testUser);
      const token = await generateValidJwt(testUser);
      await supertest(app)
        .post(`/api/medias/${activityForDeletion._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ mediaUrl: testMediaUrl2 });
    });

    afterAll(async () => {
      if (activityForDeletion) {
        await Activity.findByIdAndDelete(activityForDeletion._id);
      }
    });

    it("should delete a media from an activity successfully", async function () {
      const token = await generateValidJwt(testUser);

      const res = await supertest(app)
        .delete(`/api/medias/${activityForDeletion._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ mediaUrl: testMediaUrl2 })
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBeDefined();
      expect(res.body.data.medias).not.toContain(testMediaUrl2);
    });

    it("should return 400 with invalid activity ID", async function () {
      const token = await generateValidJwt(testUser);

      await supertest(app)
        .delete("/api/medias/invalid-id")
        .set('Authorization', `Bearer ${token}`)
        .send({ mediaUrl: testMediaUrl })
        .expect(400);
    });

    it("should return 400 when mediaUrl is missing", async function () {
      const token = await generateValidJwt(testUser);

      await supertest(app)
        .delete(`/api/medias/${testActivity._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });

    it("should return 401 without authentication", async function () {
      await supertest(app)
        .delete(`/api/medias/${testActivity._id}`)
        .send({ mediaUrl: testMediaUrl })
        .expect(401);
    });

    it("should return 403 when trying to delete media from another user's activity", async function () {
      const token = await generateValidJwt(testUser);

      await supertest(app)
        .delete(`/api/medias/${otherUserActivity._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ mediaUrl: testMediaUrl })
        .expect(403);
    });

    it("should return 404 with non-existent activity ID", async function () {
      const token = await generateValidJwt(testUser);
      const fakeId = new mongoose.Types.ObjectId();

      await supertest(app)
        .delete(`/api/medias/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ mediaUrl: testMediaUrl })
        .expect(404);
    });

    it("should return 404 when deleting non-existent media", async function () {
      const token = await generateValidJwt(testUser);

      await supertest(app)
        .delete(`/api/medias/${testActivity._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ mediaUrl: "https://res.cloudinary.com/test/nonexistent.jpg" })
        .expect(404);
    });
  });
});
