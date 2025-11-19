import supertest from "supertest";
import app from "../app.mjs";

describe("POST /api/auth/login", function () {
  it("should login in account and return JWT", async function () {
    const res = await supertest(app)
      .post("/api/auth/login")
      .send({
        email: "jpinard@bluewin.ch",
        password: "password123",
      })
      .expect(200)
      .expect("Content-Type", /json/)
  });
});