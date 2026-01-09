import supertest from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import app from "../../../app.mjs";
import User from "../../../models/UsersSchema.mjs";
import { jwtServices } from "../../../services/jwtServices.mjs";
import { closeDatabaseConnection } from "../../helpers/database.js";

describe("POST /api/auth/update-account", function () {
  let testUserId;
  let testUserToken;

  beforeAll(async () => {
    await mongoose.connection;
    await User.deleteOne({ email: "update-test@example.com" });

    const user = await User.create({
      username: "updateuser",
      email: "update-test@example.com",
      password: await bcrypt.hash("currentpassword123", 10),
      firstname: "Test",
      lastname: "User"
    });

    testUserId = user._id.toString();
    testUserToken = await jwtServices.createToken(testUserId);
  });

  afterAll(async () => {
    await User.deleteOne({ email: "update-test@example.com" });
    await User.deleteOne({ email: "newemail@example.com" });
    await User.deleteOne({ email: "existing@example.com" });
    await closeDatabaseConnection();
  });

  it("should return 200 when updating both email and password with valid current password", async function () {
    const response = await supertest(app)
      .post("/api/auth/update-account")
      .set("Authorization", `Bearer ${testUserToken}`)
      .send({
        email: "newemail@example.com",
        password: "newpassword456",
        currentPassword: "currentpassword123",
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body.success).toBe(true);
    expect(response.body.data.message).toContain("mis à jour");

    // Restore original credentials
    const hashedPassword = await bcrypt.hash("currentpassword123", 10);
    await User.findByIdAndUpdate(testUserId, {
      email: "update-test@example.com",
      password: hashedPassword
    });
  });

  it("should return 401 when current password is incorrect", async function () {
    const response = await supertest(app)
      .post("/api/auth/update-account")
      .set("Authorization", `Bearer ${testUserToken}`)
      .send({
        email: "newemail@example.com",
        password: "newpassword456",
        currentPassword: "wrongpassword123",
      })
      .expect(401)
      .expect("Content-Type", /json/);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toContain("incorrect");
  });

  it("should return 401 when trying to change password without current password", async function () {
    const response = await supertest(app)
      .post("/api/auth/update-account")
      .set("Authorization", `Bearer ${testUserToken}`)
      .send({
        email: "update-test@example.com",
        password: "newpassword456",
        // currentPassword missing
      })
      .expect(401)
      .expect("Content-Type", /json/);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toContain("requis");
  });

  it("should return 409 when new email already exists", async function () {
    // Create another user with an email
    await User.deleteOne({ email: "existing@example.com" });
    await User.create({
      username: "existinguser",
      email: "existing@example.com",
      password: await bcrypt.hash("password123", 10),
      firstname: "Existing",
      lastname: "User"
    });

    const response = await supertest(app)
      .post("/api/auth/update-account")
      .set("Authorization", `Bearer ${testUserToken}`)
      .send({
        email: "existing@example.com",
        password: "currentpassword123",
        currentPassword: "currentpassword123",
      })
      .expect(409)
      .expect("Content-Type", /json/);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toContain("déjà associé");

    await User.deleteOne({ email: "existing@example.com" });
  });


  it("should return 401 when no token is provided", async function () {
    const response = await supertest(app)
      .post("/api/auth/update-account")
      .send({
        email: "newemail@example.com",
        password: "newpassword456",
        currentPassword: "currentpassword123",
      })
      .expect(401)
      .expect("Content-Type", /json/);

    expect(response.body.message).toBeDefined();
  });

  it("should return 422 when email format is invalid", async function () {
    const response = await supertest(app)
      .post("/api/auth/update-account")
      .set("Authorization", `Bearer ${testUserToken}`)
      .send({
        email: "notanemail",
        password: "newpassword456",
        currentPassword: "currentpassword123",
      })
      .expect(422)
      .expect("Content-Type", /json/);

    expect(response.body.success).toBe(false);
  });

  it("should return 422 when password is too short", async function () {
    const response = await supertest(app)
      .post("/api/auth/update-account")
      .set("Authorization", `Bearer ${testUserToken}`)
      .send({
        email: "newemail@example.com",
        password: "short",
        currentPassword: "currentpassword123",
      })
      .expect(422)
      .expect("Content-Type", /json/);

    expect(response.body.success).toBe(false);
  });
});
