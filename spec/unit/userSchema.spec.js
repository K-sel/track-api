import mongoose from "mongoose";
import User from "../../models/UsersSchema.mjs";
import { closeDatabaseConnection } from "../helpers/database.js";

describe("UsersSchema", function () {
  beforeAll(async () => {
    await mongoose.connection;
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe("toJSON transformation", function () {
    it("should remove password field when converting to JSON", async function () {
      const testUser = new User({
        username: "testuser",
        email: "test@example.com",
        password: "hashedpassword123",
        firstname: "Test",
        lastname: "User"
      });

      const userJson = testUser.toJSON();

      expect(userJson.username).toBe("testuser");
      expect(userJson.email).toBe("test@example.com");
      expect(userJson.firstname).toBe("Test");
      expect(userJson.lastname).toBe("User");
      expect(userJson.password).toBeUndefined();
    });

    it("should keep all other fields when converting to JSON", async function () {
      const testUser = new User({
        username: "testuser",
        email: "test@example.com",
        password: "hashedpassword123",
        firstname: "Test",
        lastname: "User",
        age: 25,
        weight: 70
      });

      const userJson = testUser.toJSON();

      expect(userJson.username).toBe("testuser");
      expect(userJson.email).toBe("test@example.com");
      expect(userJson.firstname).toBe("Test");
      expect(userJson.lastname).toBe("User");
      expect(userJson.age).toBe(25);
      expect(userJson.weight).toBe(70);
      expect(userJson.password).toBeUndefined();
      expect(userJson.activityStats).toBeDefined();
    });
  });

});
