import supertest from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import app from "../../../app.mjs";
import User from "../../../models/UsersSchema.mjs";

describe("POST /api/auth/login", function () {
  afterAll(async () => {
    await User.deleteOne({ email: "test@example.com" });
    await mongoose.connection.close();
  });

  beforeAll(async () => {
    await mongoose.connection;
    await User.create({
      username: "testuser",
      email: "test@example.com",
      password: await bcrypt.hash("testpassword", 10),
      firstname: "Test",
      lastname: "User"
    });
  });

  it("should return 200 login successfully with valid credentials", async function () {
    const response = await supertest(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "testpassword",
      })
      .expect(200)
      .expect("Content-Type", /json/);
    expect(response.body).toHaveProperty("token");
  });

  it("should return 401 when account does not exist", async function () {
    const response = await supertest(app)
      .post("/api/auth/login")
      .send({
        email: "inexistant@account.com",
        password: "password123",
      })
      .expect(401)
      .expect("Content-Type", /json/);
    expect(response.body).toHaveProperty("message");
  });

  it("should return 422 when email field is missing", async function () {
    const response = await supertest(app)
      .post("/api/auth/login")
      .send({
        password: "password123",
      })
      .expect(422)
      .expect("Content-Type", /json/);
    expect(response.body).toHaveProperty("message");
  });

  it("should return 422 when password field is missing", async function () {
    const response = await supertest(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
      })
      .expect(422)
      .expect("Content-Type", /json/);
    expect(response.body).toHaveProperty("message");
  });

  it("should return 401 when password is incorrect", async function () {
    const response = await supertest(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "wrongpassword",
      })
      .expect(401)
      .expect("Content-Type", /json/);
    expect(response.body).toHaveProperty("message");
  });

  it("should return 422 when email format is invalid", async function () {
    const response = await supertest(app)
      .post("/api/auth/login")
      .send({
        email: "notanemail",
        password: "password123",
      })
      .expect(422)
      .expect("Content-Type", /json/);
    expect(response.body).toHaveProperty("message");
  });

  it("should return 422 when both fields are empty", async function () {
    const response = await supertest(app)
      .post("/api/auth/login")
      .send({
        email: "",
        password: "",
      })
      .expect(422)
      .expect("Content-Type", /json/);
    expect(response.body).toHaveProperty("message");
  });
});
