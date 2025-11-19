import supertest from "supertest";
import mongoose from "mongoose";
import app from "../app.mjs";

describe("POST /api/auth/login", function () {

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should login in account sucessfully", async function () {
    await supertest(app)
      .post("/api/auth/login")
      .send({
        email: "jpinard@bluewin.ch",
        password: "password123",
      })
      .expect(200)
      .expect("Content-Type", /json/);
  });

  it("should faild login with no account found", async function () {
    await supertest(app)
      .post("/api/auth/login")
      .send({
        email: "daniel@bluewin.ch",
        password: "password123",
      })
      .expect(401)
      .expect("Content-Type", /json/);
  });
});