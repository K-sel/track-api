import supertest from "supertest";
import app from "../../../app.mjs";
import User from "../../../models/UsersSchema.mjs";
import Activity from "../../../models/ActivitySchema.mjs";
import { generateValidJwt } from "../../helpers/utils.js";
import { createMainTestUser } from "../../fixtures/userFixtures.js";
import { createSimpleWalkActivity } from "../../fixtures/activityFixtures.js";
import { closeDatabaseConnection } from "../../helpers/database.js";

describe("PATCH /api/activities/:id - Extended validation tests", function () {
  let testUser;
  let testActivity;

  beforeEach(async () => {
    await User.deleteOne({ email: "updateactivity-extended@example.com" });
    testUser = await createMainTestUser({
      email: "updateactivity-extended@example.com"
    });
    testActivity = await createSimpleWalkActivity(testUser._id);
  });

  afterEach(async () => {
    await Activity.deleteMany({ userId: testUser._id });
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  it("should return 400 when medias is not an array", async function () {
    const token = await generateValidJwt(testUser);

    const res = await supertest(app)
      .patch(`/api/activities/${testActivity._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        medias: "not-an-array"
      })
      .expect(400)
      .expect("Content-Type", /json/);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain("tableau");
  });

  it("should return 400 when medias exceeds 10 items", async function () {
    const token = await generateValidJwt(testUser);

    const res = await supertest(app)
      .patch(`/api/activities/${testActivity._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        medias: Array(11).fill("https://example.com/image.jpg")
      })
      .expect(400)
      .expect("Content-Type", /json/);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain("Maximum 10 médias");
  });

  it("should return 400 when media item is not a valid string", async function () {
    const token = await generateValidJwt(testUser);

    const res = await supertest(app)
      .patch(`/api/activities/${testActivity._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        medias: ["https://example.com/image1.jpg", ""]
      })
      .expect(400)
      .expect("Content-Type", /json/);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain("URL valide");
  });

  it("should return 400 when media item is not a string", async function () {
    const token = await generateValidJwt(testUser);

    const res = await supertest(app)
      .patch(`/api/activities/${testActivity._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        medias: ["https://example.com/image1.jpg", 123]
      })
      .expect(400)
      .expect("Content-Type", /json/);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain("URL valide");
  });

  it("should update medias successfully when valid", async function () {
    const token = await generateValidJwt(testUser);

    const res = await supertest(app)
      .patch(`/api/activities/${testActivity._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        medias: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body.success).toBe(true);
    expect(res.body.data.activity.medias).toEqual([
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ]);
  });

  it("should update elevationGain successfully", async function () {
    const token = await generateValidJwt(testUser);

    const res = await supertest(app)
      .patch(`/api/activities/${testActivity._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        elevationGain: 300
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body.success).toBe(true);
    expect(res.body.data.activity.elevationGain).toBe(300);
  });

  it("should update elevationLoss successfully", async function () {
    const token = await generateValidJwt(testUser);

    const res = await supertest(app)
      .patch(`/api/activities/${testActivity._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        elevationLoss: 250
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body.success).toBe(true);
    expect(res.body.data.activity.elevationLoss).toBe(250);
  });

  it("should update estimatedCalories successfully", async function () {
    const token = await generateValidJwt(testUser);

    const res = await supertest(app)
      .patch(`/api/activities/${testActivity._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        estimatedCalories: 800
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body.success).toBe(true);
    expect(res.body.data.activity.estimatedCalories).toBe(800);
  });
});
