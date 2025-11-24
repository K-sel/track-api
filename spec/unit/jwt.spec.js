import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
} from "@jest/globals";
import { jwtAuthenticate } from "../../middleware/jwtAuthenticate.mjs";
import { generateValidJwt, generateExpiredJwt } from "../helpers/utils";
import { closeDatabaseConnection } from "../helpers/database";
import User from "../../models/UsersSchema.mjs";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import "dotenv/config";

describe("JWT Authenticate middleware test", () => {
  let req, res, next;

  afterAll(async () => {
    await User.deleteOne({ email: "test@example.com" });
    await closeDatabaseConnection();
  });

  beforeAll(async () => {
    await mongoose.connect(process.env.DATABASE_URL);
    await User.create({
      username: "testuser",
      email: "test@example.com",
      password: await bcrypt.hash("testpassword", 10),
      firstname: "Test",
      lastname: "User",
    });
  });

  beforeEach(() => {
    req = {
      get: jest.fn(),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("should call next() if JWT is valid", async () => {
    const user = await User.findOne({ email: "test@example.com" });
    const token = await generateValidJwt(user);
    req.get.mockReturnValue(`Bearer ${token}`);

    await jwtAuthenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 401 is token is missing", async () => {
    req.get.mockReturnValue("");

    await jwtAuthenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Authorization header is missing",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 is token is not Bearer type", async () => {
    const user = await User.findOne({ email: "test@example.com" });
    const token = await generateValidJwt(user);
    req.get.mockReturnValue(`${token}`);

    await jwtAuthenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Authorization header is not a bearer token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 is token is expired", async () => {
    const user = await User.findOne({ email: "test@example.com" });
    const token = await generateExpiredJwt(user);
    req.get.mockReturnValue(`Bearer ${token}`);

    await jwtAuthenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Your token is invalid or has expired",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
