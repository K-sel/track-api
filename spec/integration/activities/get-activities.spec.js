import supertest from "supertest";
import app from "../../../app.mjs";
import User from "../../../models/UsersSchema.mjs";
import Activity from "../../../models/ActivitySchema.mjs";
import { generateValidJwt } from "../../helpers/utils.js";
import { createMultipleActivities, createSimpleWalkActivity } from "../../fixtures/activityFixtures.js";
import { createMainTestUser, createSecondaryTestUser } from "../../fixtures/userFixtures.js";
import { closeDatabaseConnection } from "../../helpers/database.js";

describe("GET /api/activities", function () {
  let testUser;
  let otherUser;

  beforeAll(async () => {
    // Créer deux utilisateurs de test
    testUser = await createMainTestUser();
    otherUser = await createSecondaryTestUser({
      username: "otheruser2",
      email: "other2@example.com",
      lastname: "User2"
    });

    // Créer plusieurs activités pour testUser
    await createMultipleActivities(testUser._id);

    // Créer une activité pour l'autre utilisateur (pour vérifier l'isolation)
    await createSimpleWalkActivity(otherUser._id);
  });

  afterAll(async () => {
    // Nettoyer toutes les activités créées
    await Activity.deleteMany({ userId: { $in: [testUser._id, otherUser._id] } });

    // Nettoyer les utilisateurs de test
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }
    if (otherUser) {
      await User.findByIdAndDelete(otherUser._id);
    }

    // Fermer la connexion à la base de données
    await closeDatabaseConnection();
  });

  it("should get all user's activities successfully", async function () {
    const token = await generateValidJwt(testUser);

    const res = await supertest(app)
      .get("/api/activities")
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(3); // Seulement les activités de testUser

    // Vérifier que toutes les activités appartiennent à testUser
    res.body.data.forEach(activity => {
      expect(activity.userId).toBe(testUser._id.toString());
    });
  });

  it("should return activities sorted by date (newest first) by default", async function () {
    const token = await generateValidJwt(testUser);

    const res = await supertest(app)
      .get("/api/activities")
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.length).toBe(3);

    // Vérifier que les dates sont triées du plus récent au plus ancien
    const dates = res.body.data.map(a => new Date(a.date).getTime());
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
    }
  });

  it("should filter activities by type", async function () {
    const token = await generateValidJwt(testUser);

    const res = await supertest(app)
      .get("/api/activities?activityType=run")
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].activityType).toBe('run');
  });

  it("should filter activities by date range", async function () {
    const token = await generateValidJwt(testUser);
    const now = new Date();
    const startDate = new Date(now.getTime() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];

    const res = await supertest(app)
      .get(`/api/activities?startDate=${startDate}&endDate=${endDate}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Devrait retourner les 2 activités récentes (1 jour et 7 jours), pas celle de 14 jours
    expect(res.body.data.length).toBe(2);
  });

  it("should filter activities by distance range", async function () {
    const token = await generateValidJwt(testUser);

    const res = await supertest(app)
      .get("/api/activities?minDistance=5000&maxDistance=20000")
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Devrait retourner les activités avec distance entre 5km et 20km (run=10km, trail=15km)
    expect(res.body.data.length).toBe(2);
    res.body.data.forEach(activity => {
      expect(activity.distance).toBeGreaterThanOrEqual(5000);
      expect(activity.distance).toBeLessThanOrEqual(20000);
    });
  });

  it("should sort activities by distance ascending", async function () {
    const token = await generateValidJwt(testUser);

    const res = await supertest(app)
      .get("/api/activities?sort=distance")
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.length).toBe(3);

    // Vérifier que les distances sont triées du plus petit au plus grand
    const distances = res.body.data.map(a => a.distance);
    for (let i = 0; i < distances.length - 1; i++) {
      expect(distances[i]).toBeLessThanOrEqual(distances[i + 1]);
    }
  });

  it("should sort activities by distance descending", async function () {
    const token = await generateValidJwt(testUser);

    const res = await supertest(app)
      .get("/api/activities?sort=-distance")
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.length).toBe(3);

    // Vérifier que les distances sont triées du plus grand au plus petit
    const distances = res.body.data.map(a => a.distance);
    for (let i = 0; i < distances.length - 1; i++) {
      expect(distances[i]).toBeGreaterThanOrEqual(distances[i + 1]);
    }
  });

  it("should support pagination with limit", async function () {
    const token = await generateValidJwt(testUser);

    const res = await supertest(app)
      .get("/api/activities?limit=2")
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.length).toBe(2);
  });

  it("should support pagination with page and limit", async function () {
    const token = await generateValidJwt(testUser);

    // Page 1 avec limite de 2
    const res1 = await supertest(app)
      .get("/api/activities?page=1&limit=2")
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res1.body.data.length).toBe(2);

    // Page 2 avec limite de 2
    const res2 = await supertest(app)
      .get("/api/activities?page=2&limit=2")
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res2.body.data.length).toBe(1); // Il ne reste qu'une activité

    // Vérifier que les activités sont différentes
    const ids1 = res1.body.data.map(a => a._id);
    const ids2 = res2.body.data.map(a => a._id);
    expect(ids1).not.toContain(ids2[0]);
  });

  it("should return empty array when no activities match filters", async function () {
    const token = await generateValidJwt(testUser);

    const res = await supertest(app)
      .get("/api/activities?activityType=hiking")
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.length).toBe(0);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("should return 401 without authentication token", async function () {
    await supertest(app)
      .get("/api/activities")
      .expect(401);
  });

  it("should return 401 with invalid token", async function () {
    await supertest(app)
      .get("/api/activities")
      .set('Authorization', 'Bearer invalid-token-123')
      .expect(401);
  });

  it("should combine multiple filters correctly", async function () {
    const token = await generateValidJwt(testUser);
    const now = new Date();
    const startDate = new Date(now.getTime() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const res = await supertest(app)
      .get(`/api/activities?activityType=run&startDate=${startDate}&minDistance=5000`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].activityType).toBe('run');
  });
});
