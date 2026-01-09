import supertest from "supertest";
import app from "../../../app.mjs";
import User from "../../../models/UsersSchema.mjs";
import Activity from "../../../models/ActivitySchema.mjs";
import { generateValidJwt } from "../../helpers/utils.js";
import { createMainTestUser } from "../../fixtures/userFixtures.js";
import { closeDatabaseConnection } from "../../helpers/database.js";

describe("GET /api/activities - Extended validation tests", function () {
  let testUser;

  beforeAll(async () => {
    await User.deleteOne({ email: "getactivities-extended@example.com" });
    testUser = await createMainTestUser({
      email: "getactivities-extended@example.com"
    });
  });

  afterAll(async () => {
    await Activity.deleteMany({ userId: testUser._id });
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }
    await closeDatabaseConnection();
  });

  it("should return 400 when minDistance is not a number", async function () {
    const token = await generateValidJwt(testUser);

    const res = await supertest(app)
      .get("/api/activities?minDistance=invalid")
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
      .expect("Content-Type", /json/);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain("minDistance doit être un nombre");
  });

  it("should return 400 when maxDistance is not a number", async function () {
    const token = await generateValidJwt(testUser);

    const res = await supertest(app)
      .get("/api/activities?maxDistance=invalid")
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
      .expect("Content-Type", /json/);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain("maxDistance doit être un nombre");
  });
});
