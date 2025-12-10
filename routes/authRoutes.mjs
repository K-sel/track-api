import express from "express";

//Controller
import { authController } from "../controllers/authController.mjs";

// Middlewares
import { validateEmail } from "../middleware/auth/validateEmail.mjs";
import { validatePassword } from "../middleware/auth/validatePassword.mjs";
import { validateUsername } from "../middleware/auth/validateUsername.mjs";
import { validateFirstname } from "../middleware/auth/validateFirstname.mjs";
import { validateLastname } from "../middleware/auth/validateLastname.mjs";

const router = express.Router();

router.post("/create-account", validateEmail, validatePassword, validateUsername, validateFirstname, validateLastname, authController.createUser )
router.post("/login", validateEmail, validatePassword, authController.login)
router.post("/update-account", validateEmail, validatePassword, authController.updateUserCredentials)
router.post("/delete-account", validatePassword, authController.deleteUser)

export default router;
