import express from "express";

//Controller
import { authController } from "../controllers/authController.mjs";

// Middlewares
import { validateEmail } from "../middleware/auth/validateEmail.mjs";
import { validatePassword } from "../middleware/auth/validatePassword.mjs";
import { validateUsername } from "../middleware/auth/validateUsername.mjs";

const router = express.Router();

router.post("/register", validateEmail, validatePassword, validateUsername, authController.createUser )
router.post("/login", validateEmail, validatePassword, authController.login )

export default router;
