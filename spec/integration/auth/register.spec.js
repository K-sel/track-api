import supertest from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import app from "../../../app.mjs";
import User from "../../../models/UsersSchema.mjs";

describe("POST /api/auth/register", function () {
  afterAll(async () => {
    await User.deleteOne({ email: "test@example.com" });
    await mongoose.connection.close();
  });

  beforeAll(async () => {
    await mongoose.connection;
  });

  it("should return 201 registered successfully", async function () {
    const response = await supertest(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        email: "test@example.com",
        password: await bcrypt.hash("testpassword", 10),
        firstname: "Test",
        lastname: "User",
      })
      .expect(201)
      .expect("Content-Type", /json/);
    expect(response.body).toMatchObject({
      success: expect.any(Boolean),
      message: expect.any(String),
      id: expect.any(String),
    });
  });
});
