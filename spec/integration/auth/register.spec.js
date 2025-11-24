import supertest from "supertest";
import mongoose from "mongoose";
import app from "../../../app.mjs";
import User from "../../../models/UsersSchema.mjs";
import { closeDatabaseConnection } from "../../helpers/database.js";

describe("POST /api/auth/register", function () {
  beforeAll(async () => {
    await mongoose.connection;
    // Nettoyer avant les tests pour éviter les duplications
    await User.deleteOne({ email: "test@example.com" });
  });

  afterAll(async () => {
    await User.deleteOne({ email: "test@example.com" });
    await closeDatabaseConnection();
  });

  it("should return 201 registered successfully", async function () {
    const response = await supertest(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        email: "test@example.com",
        password: "validpassword123",
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

  it("should return 409 is email is already used", async function () {
    const response = await supertest(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        email: "test@example.com",
        password: "validpassword123",
        firstname: "Test",
        lastname: "User",
      })
      .expect(409)
      .expect("Content-Type", /json/);
    expect(response.body).toMatchObject({
      message: expect.any(String),
    });
  });

  it("should return 422 if request is not conform", async function () {
    const response = await supertest(app)
      .post("/api/auth/register")
      .send({ "": "" })
      .expect(422)
      .expect("Content-Type", /json/);
    expect(response.body).toMatchObject({
      message: expect.any(String),
    });
  });

  it("should return 422 if password is too short", async function () {
    const response = await supertest(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        email: "test@example.com",
        password: "tooshort",
        firstname: "Test",
        lastname: "User",
      })
      .expect(422)
      .expect("Content-Type", /json/);
    expect(response.body).toMatchObject({
      message: expect.any(String),
    });
  });

  it("should return 422 if email is missing", async function () {
    const response = await supertest(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        password: "validpassword123",
        firstname: "Test",
        lastname: "User",
      })
      .expect(422)
      .expect("Content-Type", /json/);
    expect(response.body).toMatchObject({
      message: expect.any(String),
    });
  });

  it("should return 422 if email format is invalid", async function () {
    const response = await supertest(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        email: "notanemail",
        password: "validpassword123",
        firstname: "Test",
        lastname: "User",
      })
      .expect(422)
      .expect("Content-Type", /json/);
    expect(response.body).toMatchObject({
      message: expect.any(String),
    });
  });

  it("should return 422 if password is missing", async function () {
    const response = await supertest(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        email: "newuser@example.com",
        firstname: "Test",
        lastname: "User",
      })
      .expect(422)
      .expect("Content-Type", /json/);
    expect(response.body).toMatchObject({
      message: expect.any(String),
    });
  });

  it("should return 422 if username is missing", async function () {
    const response = await supertest(app)
      .post("/api/auth/register")
      .send({
        email: "newuser@example.com",
        password: "validpassword123",
        firstname: "Test",
        lastname: "User",
      })
      .expect(422)
      .expect("Content-Type", /json/);
    expect(response.body).toMatchObject({
      message: expect.any(String),
    });
  });

  it("should return 422 if username is too short", async function () {
    const response = await supertest(app)
      .post("/api/auth/register")
      .send({
        username: "a",
        email: "newuser@example.com",
        password: "validpassword123",
        firstname: "Test",
        lastname: "User",
      })
      .expect(422)
      .expect("Content-Type", /json/);
    expect(response.body).toMatchObject({
      message: expect.any(String),
    });
  });

  it("should return 422 if firstname is missing", async function () {
    const response = await supertest(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        email: "newuser@example.com",
        password: "validpassword123",
        lastname: "User",
      })
      .expect(422)
      .expect("Content-Type", /json/);
    expect(response.body).toMatchObject({
      message: expect.any(String),
    });
  });

  it("should return 422 if firstname is too short", async function () {
    const response = await supertest(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        email: "newuser@example.com",
        password: "validpassword123",
        firstname: "T",
        lastname: "User",
      })
      .expect(422)
      .expect("Content-Type", /json/);
    expect(response.body).toMatchObject({
      message: expect.any(String),
    });
  });

  it("should return 422 if lastname is missing", async function () {
    const response = await supertest(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        email: "newuser@example.com",
        password: "validpassword123",
        firstname: "Test",
      })
      .expect(422)
      .expect("Content-Type", /json/);
    expect(response.body).toMatchObject({
      message: expect.any(String),
    });
  });

  it("should return 422 if lastname is too short", async function () {
    const response = await supertest(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        email: "newuser@example.com",
        password: "validpassword123",
        firstname: "Test",
        lastname: "U",
      })
      .expect(422)
      .expect("Content-Type", /json/);
    expect(response.body).toMatchObject({
      message: expect.any(String),
    });
  });

  it("should return 500 if connection to mongoDB is lost", async function () {
    await mongoose.connection.close();

    const response = await supertest(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        email: "test@example.com",
        password: "validpassword123",
        firstname: "Test",
        lastname: "User",
      })
      .expect(500)
      .expect("Content-Type", /json/);
    expect(response.body).toMatchObject({
      message: expect.any(String),
    });

    await mongoose.connect(process.env.DATABASE_URL);
  });
});
