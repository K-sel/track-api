import express from "express";
import rateLimit from "express-rate-limit";

//Controller
import { authController } from "../controllers/authController.mjs";

// Middlewares
import { validateEmail } from "../middleware/auth/validateEmail.mjs";
import { validatePassword } from "../middleware/auth/validatePassword.mjs";
import { validateUsername } from "../middleware/auth/validateUsername.mjs";
import { validateFirstname } from "../middleware/auth/validateFirstname.mjs";
import { validateLastname } from "../middleware/auth/validateLastname.mjs";
import { jwtAuthenticate } from "../middleware/jwtAuthenticate.mjs";

const router = express.Router();

const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // 10 créations de compte max par IP par heure
  message: {
    success: false,
    error: {
      message: "Trop de tentatives de création de compte. Veuillez réessayer plus tard.",
      code: "ERR_RATE_LIMIT"
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 tentatives de login max par IP
  message: {
    success: false,
    error: {
      message: "Trop de tentatives de connexion. Veuillez réessayer dans 5 minutes.",
      code: "ERR_RATE_LIMIT"
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/create-account", createAccountLimiter, validateEmail, validatePassword, validateUsername, validateFirstname, validateLastname, authController.createUser )
router.post("/login", loginLimiter, validateEmail, validatePassword, authController.login)
router.post("/update-account", jwtAuthenticate, validateEmail, validatePassword, authController.updateUserCredentials)
router.delete("/delete-account", jwtAuthenticate, validatePassword, authController.deleteUser)

export default router;
