import supertest from "supertest";
import mongoose from "mongoose";
import app from "../app.mjs";
import User from "../models/UsersSchema.mjs";
import { generateValidJwt } from "./utils.js";

describe("POST /api/activities", function () {
  let testUser;

  beforeAll(async () => {
    // Créer un utilisateur de test pour générer le JWT
    testUser = await User.create({
      username: "testuser",
      email: "test@example.com",
      password: "hashedpassword123",
      firstname: "Test",
      lastname: "User",
      age: 25
    });
  });

  afterAll(async () => {
    // Nettoyer l'utilisateur de test
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }
    await mongoose.connection.close();
  });

  // Tester si un utilisateur connecté reçoit bien ses activités
  it("should login in account sucessfully", async function () {
    const token = await generateValidJwt(testUser);

    await supertest(app)
      .get("/api/activities")
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect("Content-Type", /json/);
  });
});